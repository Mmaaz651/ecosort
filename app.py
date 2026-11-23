import os
import base64
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI

app = Flask(__name__, static_folder='static')

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY") or os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY"),
    base_url=os.environ.get("OPENAI_BASE_URL") or os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
)

users_db = {}
bag_submissions_db = []
management_feedback_db = {}

MANAGEMENT_ID = "123"
MANAGEMENT_KEY = "123"

PICKUP_SCHEDULE = {
    "Monday": "green",
    "Tuesday": "blue",
    "Wednesday": "white",
    "Thursday": "green",
    "Friday": "blue"
}

WASTE_DATA = {
    "recycling": {
        "items": ["plastic bottle", "aluminum can", "glass bottle", "cardboard", "paper", "newspaper", "magazine", "milk carton", "plastic container", "tin can", "metal lid", "glass jar"],
        "co2_factor": 2.0,
        "money_factor": 0.4
    },
    "compost": {
        "items": ["food scraps", "banana peel", "apple core", "coffee grounds", "tea bag", "eggshell", "vegetable peels", "fruit", "leaves", "grass clippings", "paper towel", "napkin", "tissue", "pizza box (soiled)"],
        "co2_factor": 0.5,
        "money_factor": 0.2
    },
    "landfill": {
        "items": ["styrofoam", "chip bag", "candy wrapper", "plastic straw", "broken glass", "ceramic", "diaper", "pet waste", "cigarette butt", "rubber band"],
        "co2_factor": 0.1,
        "money_factor": 0.05
    },
    "e-waste": {
        "items": ["phone", "laptop", "battery", "charger", "headphones", "cable", "keyboard", "mouse", "tablet", "monitor", "tv", "remote", "light bulb", "led bulb"],
        "co2_factor": 5.0,
        "money_factor": 1.0
    }
}

def calculate_points(score):
    if score >= 90:
        return 100
    elif score >= 80:
        return 75
    elif score >= 70:
        return 50
    elif score >= 60:
        return 25
    else:
        return 0

def get_week_start():
    today = datetime.now()
    return today - timedelta(days=today.weekday())

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/user/register', methods=['POST'])
def register_user():
    data = request.json
    name = data.get('name', '').strip()
    house_number = data.get('house_number', '').strip()
    
    if not name or not house_number:
        return jsonify({"error": "Name and house number are required"}), 400
    
    if house_number not in users_db:
        users_db[house_number] = {
            "name": name,
            "house_number": house_number,
            "created_at": datetime.now().isoformat(),
            "total_points": 0
        }
    else:
        users_db[house_number]["name"] = name
    
    return jsonify({
        "success": True,
        "user": users_db[house_number]
    })

@app.route('/api/user/<house_number>', methods=['GET'])
def get_user(house_number):
    if house_number not in users_db:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(users_db[house_number])

@app.route('/api/user/<house_number>/stats', methods=['GET'])
def get_user_stats(house_number):
    week_start = get_week_start()
    
    user_submissions = [s for s in bag_submissions_db 
                       if s['house_number'] == house_number]
    
    weekly_submissions = [s for s in user_submissions 
                         if datetime.fromisoformat(s['submitted_at']) >= week_start]
    
    total_bags = len(weekly_submissions)
    avg_score = sum(s['score'] for s in weekly_submissions) / total_bags if total_bags > 0 else 0
    
    total_points = users_db.get(house_number, {}).get('total_points', 0)
    
    feedback = management_feedback_db.get(house_number, [])
    
    return jsonify({
        "weekly_bags": total_bags,
        "weekly_avg_score": round(avg_score, 1),
        "total_points": total_points,
        "total_submissions": len(user_submissions),
        "recent_submissions": weekly_submissions[-5:] if weekly_submissions else [],
        "pickup_schedule": PICKUP_SCHEDULE,
        "management_feedback": feedback[-3:] if feedback else []
    })

@app.route('/api/management/login', methods=['POST'])
def management_login():
    data = request.json
    mgmt_id = data.get('id', '')
    mgmt_key = data.get('key', '')
    
    if mgmt_id == MANAGEMENT_ID and mgmt_key == MANAGEMENT_KEY:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/management/households', methods=['GET'])
def get_households():
    households = []
    
    for house_number, user in users_db.items():
        submissions = [s for s in bag_submissions_db if s['house_number'] == house_number]
        avg_score = sum(s['score'] for s in submissions) / len(submissions) if submissions else 0
        
        status = "ok"
        if len(submissions) == 0:
            status = "no_data"
        elif avg_score < 60:
            status = "needs_attention"
        elif avg_score < 75:
            status = "review"
        
        households.append({
            "house_number": house_number,
            "name": user["name"],
            "bags_submitted": len(submissions),
            "avg_score": round(avg_score, 1),
            "total_points": user.get("total_points", 0),
            "status": status,
            "last_submission": submissions[-1]["submitted_at"] if submissions else None
        })
    
    return jsonify(households)

@app.route('/api/management/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    house_number = data.get('house_number')
    feedback_text = data.get('feedback', '').strip()
    point_adjustment = data.get('point_adjustment', 0)
    
    if not house_number or house_number not in users_db:
        return jsonify({"error": "Invalid house number"}), 400
    
    feedback_entry = {
        "feedback": feedback_text,
        "point_adjustment": point_adjustment,
        "submitted_at": datetime.now().isoformat()
    }
    
    if house_number not in management_feedback_db:
        management_feedback_db[house_number] = []
    management_feedback_db[house_number].append(feedback_entry)
    
    users_db[house_number]["total_points"] += point_adjustment
    
    return jsonify({"success": True})

@app.route('/api/bag/submit', methods=['POST'])
def submit_bag():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    
    house_number = request.form.get('house_number')
    bag_type = request.form.get('bag_type', 'unknown')
    
    if not house_number or house_number not in users_db:
        return jsonify({"error": "Invalid house number. Please register first."}), 400
    
    image_data = file.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')
    mime_type = file.content_type or 'image/jpeg'
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a PEI/IWMC waste sorting quality inspector. Analyze this image of a filled garbage bag and evaluate how well it is sorted according to PEI (Island Waste Management) guidelines.

The user claims this is a {bag_type} bag. Evaluate if the contents match what should go in that bag type.

Bag color meanings (generic recycling guidelines):
- Green bag: Compost/organic waste (food scraps, yard waste, organic matter)
- Blue bag: Recycling (plastics, metals, glass, paper, cardboard)
- White/Black bag: Landfill/general waste (non-recyclable items)

PEI-specific notes:
- Napkins, paper towels, tissues, and soiled paper belong in compost.
- Food-soiled paper (e.g., greasy pizza boxes) belongs in compost.

Respond with ONLY valid JSON in this exact format:
{{
    "score": integer from 0-100 representing sorting quality,
    "grade": "A", "B", "C", "D", or "F" based on score,
    "is_properly_sorted": true or false,
    "items_detected": ["list", "of", "visible", "items"],
    "contamination_issues": ["list of items that don't belong in this bag type"],
    "explanation": "Brief explanation of why the bag received this score",
    "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
    "confidence": "high", "medium", or "low"
}}"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Evaluate this {bag_type} garbage bag. Is it properly sorted?"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=600
        )
        
        result_content = response.choices[0].message.content
        if result_content is None:
            raise ValueError("No response from AI model")
        result_text = result_content.strip()
        
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        result_text = result_text.strip()
        
        ai_result = json.loads(result_text)
        
        score = ai_result.get("score", 50)
        points_earned = calculate_points(score)
        
        submission = {
            "id": len(bag_submissions_db) + 1,
            "house_number": house_number,
            "bag_type": bag_type,
            "score": score,
            "grade": ai_result.get("grade", "C"),
            "is_properly_sorted": ai_result.get("is_properly_sorted", False),
            "items_detected": ai_result.get("items_detected", []),
            "contamination_issues": ai_result.get("contamination_issues", []),
            "explanation": ai_result.get("explanation", ""),
            "suggestions": ai_result.get("suggestions", []),
            "confidence": ai_result.get("confidence", "low"),
            "points_earned": points_earned,
            "submitted_at": datetime.now().isoformat()
        }
        
        bag_submissions_db.append(submission)
        users_db[house_number]["total_points"] += points_earned
        
        return jsonify({
            **submission,
            "total_points": users_db[house_number]["total_points"]
        })
        
    except Exception as e:
        print(f"Error analyzing bag: {e}")
        return jsonify({
            "error": "Failed to analyze bag. Please try again.",
            "details": str(e)
        }), 500

@app.route('/classify-image', methods=['POST'])
def classify_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    
    image_data = file.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    mime_type = file.content_type or 'image/jpeg'
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """You are a PEI/IWMC waste classification expert. Analyze the image and identify the main item that needs to be disposed of according to PEI (Island Waste Management) guidelines.

Respond with ONLY valid JSON in this exact format:
{
    "item": "name of the item (e.g., plastic bottle, banana peel, old phone)",
    "bin": "one of: recycling, compost, landfill, e-waste",
    "weight_grams": estimated weight in grams (integer between 5 and 2000),
    "confidence": your confidence level (high, medium, or low)
}

Bin categories:
- recycling: plastics, metals, glass, paper, cardboard
- compost: food waste, organic matter, yard waste
- landfill: non-recyclable items, mixed materials, contaminated items
- e-waste: electronics, batteries, cables, devices

PEI-specific notes:
- Napkins, paper towels, tissues, and soiled paper belong in compost.
- Food-soiled paper (e.g., greasy pizza boxes) belongs in compost.

Be specific about the item name and accurate with the bin classification."""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "What item is in this image and which waste bin should it go in?"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        
        result_content = response.choices[0].message.content
        if result_content is None:
            raise ValueError("No response from AI model")
        result_text = result_content.strip()
        
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        result_text = result_text.strip()
        
        ai_result = json.loads(result_text)
        
        item = ai_result.get("item", "unknown item")
        bin_type = ai_result.get("bin", "landfill")
        weight = ai_result.get("weight_grams", 50)
        
        if bin_type not in WASTE_DATA:
            bin_type = "landfill"
        
        waste_info = WASTE_DATA[bin_type]
        co2_saved = int(weight * waste_info["co2_factor"])
        money_saved = int(weight * waste_info["money_factor"])
        
        return jsonify({
            "item": item,
            "bin": bin_type,
            "waste_saved_grams": weight,
            "co2_saved_grams": co2_saved,
            "money_saved_cents": money_saved,
            "confidence": ai_result.get("confidence", "medium")
        })
        
    except Exception as e:
        print(f"Error classifying image: {e}")
        return jsonify({
            "error": "Failed to classify image. Please try again.",
            "details": str(e)
        }), 500

@app.route('/check-bag', methods=['POST'])
def check_bag():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400
    
    bag_type = request.form.get('bag_type', 'unknown')
    
    image_data = file.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    mime_type = file.content_type or 'image/jpeg'
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a PEI/IWMC waste sorting quality inspector. Analyze this image of a filled garbage bag and evaluate how well it is sorted according to PEI (Island Waste Management) guidelines.

The user claims this is a {bag_type} bag. Evaluate if the contents match what should go in that bag type.

Bag color meanings (generic recycling guidelines):
- Green bag: Compost/organic waste (food scraps, yard waste, organic matter)
- Blue bag: Recycling (plastics, metals, glass, paper, cardboard)
- White/Black bag: Landfill/general waste (non-recyclable items)

PEI-specific notes:
- Napkins, paper towels, tissues, and soiled paper belong in compost.
- Food-soiled paper (e.g., greasy pizza boxes) belongs in compost.

Respond with ONLY valid JSON in this exact format:
{{
    "score": integer from 0-100 representing sorting quality,
    "grade": "A", "B", "C", "D", or "F" based on score,
    "is_properly_sorted": true or false,
    "bag_type_correct": true or false (does content match claimed bag type),
    "items_detected": ["list", "of", "visible", "items"],
    "contamination_issues": ["list of items that don't belong in this bag type"],
    "explanation": "Brief explanation of why the bag received this score",
    "suggestions": ["actionable suggestion 1", "actionable suggestion 2"],
    "confidence": "high", "medium", or "low"
}}

Scoring guide:
- 90-100 (A): Perfectly sorted, no contamination
- 80-89 (B): Well sorted, minor issues
- 70-79 (C): Acceptable, some contamination
- 60-69 (D): Poor sorting, significant contamination
- 0-59 (F): Failed, major contamination or wrong bag type

Be honest about limitations - if the image is unclear or you cannot identify items with certainty, reflect that in confidence level and explanation."""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Evaluate this {bag_type} garbage bag. Is it properly sorted? What items can you see?"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=600
        )
        
        result_content = response.choices[0].message.content
        if result_content is None:
            raise ValueError("No response from AI model")
        result_text = result_content.strip()
        
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        result_text = result_text.strip()
        
        ai_result = json.loads(result_text)
        
        return jsonify({
            "score": ai_result.get("score", 50),
            "grade": ai_result.get("grade", "C"),
            "is_properly_sorted": ai_result.get("is_properly_sorted", False),
            "bag_type_correct": ai_result.get("bag_type_correct", True),
            "items_detected": ai_result.get("items_detected", []),
            "contamination_issues": ai_result.get("contamination_issues", []),
            "explanation": ai_result.get("explanation", "Unable to determine sorting quality."),
            "suggestions": ai_result.get("suggestions", ["Please ensure items match the bag type."]),
            "confidence": ai_result.get("confidence", "low"),
            "bag_type": bag_type
        })
        
    except Exception as e:
        print(f"Error checking bag: {e}")
        return jsonify({
            "error": "Failed to analyze bag. Please try again.",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
