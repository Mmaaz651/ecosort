# EcoSort

A web app that tells a household which bag a piece of waste goes in, scores a filled bag from a photo, and gives the waste authority a dashboard of sorting quality per household. It follows the Prince Edward Island bag system (green for compost, blue for recycling, white for waste).

Built in two days at the Hack With SMCSS Green World hackathon in January 2026, where it won first place and the audience vote.

## Why

One wrongly sorted bag can send a whole load of recycling to landfill. Residents get no feedback after a mistake, and the waste authority cannot see sorting quality before the truck arrives.

## What it does

**For a resident**
- Item scanner: upload a photo of one item and get the right bin and bag colour.
- Bag checker: upload a photo of a filled bag and get a sorting score with the items that do not belong.
- Weekly summary: bags submitted, average score, points earned, and the pickup days by bag colour.

**For the waste authority**
- A dashboard listing each household with its number of bags and average score.
- Feedback can be sent back to a household.

## How it works

- Backend: Python and Flask (`app.py`), with JSON endpoints for profiles, bag submissions and the dashboard.
- Image analysis: the photo is sent to an OpenAI vision model (`gpt-4o`) with the PEI sorting rules in the prompt; the model returns the bag type, a score and the problem items.
- Points come from fixed score bands, so a resident can see why they got them.
- Frontend: plain HTML, CSS and JavaScript in `static/`.
- `data/pei_iwmc_items.jsonl` lists 287 common items with their PEI bag label.

## Run it

```
pip install -r requirements.txt
export OPENAI_API_KEY=your_key
python app.py
```

Then open http://127.0.0.1:5000. The management view uses the demo login in `app.py`.

## Limits

- It is a hackathon demo. Data is kept in memory and is lost when the server stops.
- Scores are estimates from what is visible in the photo.
- There is no real login and no enforcement logic.

## Team

Muhammad Maaz and a teammate ([@elsxbxh](https://github.com/elsxbxh)), who added the PEI item dataset.
