# EcoSort - Waste Sorting Assistant

## Overview
EcoSort is an AI-powered waste sorting assistant that helps users identify the correct bin for their waste items. Upload an image and the app uses OpenAI Vision API to classify items and provide sustainability impact metrics.

## Current State
- Fully functional waste classification app
- Pure HTML, CSS, JavaScript frontend (no frameworks)
- Python Flask backend with OpenAI Vision API integration

## Project Structure
```
/
├── app.py              # Flask backend with /classify-image endpoint
├── static/
│   ├── index.html      # Main HTML page
│   ├── styles.css      # Eco-friendly themed styles
│   └── app.js          # Frontend logic and localStorage
├── pyproject.toml      # Python dependencies
└── replit.md           # This file
```

## Features
- Drag & drop image upload with file picker
- AI-based waste classification using GPT-4o Vision
- Color-coded bin recommendations (Blue=Recycling, Green=Compost, Gray=Landfill, Red=E-waste)
- Sustainability metrics (waste diverted, CO2 saved, money saved)
- Total impact counter saved in localStorage
- Mobile-friendly responsive design

## API Endpoint
**POST /classify-image**
- Accepts: multipart/form-data with 'image' field
- Returns:
```json
{
  "item": "plastic bottle",
  "bin": "recycling",
  "waste_saved_grams": 25,
  "co2_saved_grams": 50,
  "money_saved_cents": 10,
  "confidence": "high"
}
```

## Running the App
The app runs on port 5000 using Flask development server.

## Recent Changes
- January 2026: Initial implementation with full feature set
