# Waste Sorting Assistant – User & Management Demo Web App

## Overview

Waste Sorting Assistant is a web-based application designed to help households correctly sort waste and to provide waste management teams with visibility into sorting quality at the household level. The application focuses on guiding users at the moment of disposal and providing feedback before collection, helping reduce recycling and compost contamination.

---

## Problem Statement

Incorrect waste sorting is a major cause of recycling contamination, leading to entire loads being diverted to landfills. Many residents are unsure which items belong in which waste streams, and there is little feedback after mistakes are made. Waste management teams also lack simple tools to assess sorting quality at the household level.

---

## Solution

The application provides a single platform with two perspectives:

- **Resident (User) View**: Helps residents correctly sort items, evaluate filled garbage bags, and understand mistakes.
- **Management View**: Provides waste management teams with household-level visibility into sorting quality to support pickup decisions.

The system is intended as an educational and decision-support tool, not an enforcement system.

---

## Key Features

### Item Scanner
- Upload a photo of a single waste item
- Receive guidance on:
  - Correct waste bin
  - Correct bag color (green, blue, or white)

### Bag Quality Checker
- Upload a photo of an already-filled garbage bag
- Receive:
  - A sorting quality score
  - A clear explanation of why the bag received that score
  - Actionable suggestions to improve sorting

### Simple User Profiles
- Users create a profile by entering:
  - Name
  - House number
- No passwords or complex authentication
- Each profile represents one household

### Weekly User Summary
- Total number of bags submitted during the week
- Average sorting score for the week
- Display of bag pickup days by bag type

### Performance Points
- Users earn points based on sorting quality
- Points are rule-based and transparent
- Points are visible in the user dashboard

### Management Dashboard
- Single management view for demo purposes
- Displays:
  - House numbers
  - Resident names
  - Number of bags submitted
  - Average sorting scores
- Supports informed pickup decision-making

---

## Application Structure

### User Flow
1. Enter name and house number
2. Access item scanning and bag checking tools
3. Submit bag photos for evaluation
4. View feedback, weekly summaries, and points

### Management Flow
1. Access management view using fixed demo credentials
2. Review household-level sorting performance
3. Use aggregated scores to support pickup decisions

---

## Technical Notes

- Image analysis and scoring are estimate-based by AI
- Sorting logic is rule-based and designed for transparency
- No real municipal enforcement logic is implemented

### Demo Mode and Live Mode

- Full AI functionality runs in the development environment
- The GitHub Pages deployment runs in demo mode
- No API keys or secrets are exposed in the public repository

This separation follows standard security and deployment best practices.

---

## Limitations

- Image classification accuracy is not guaranteed
- Local recycling rules vary by region
- Bag quality scores are estimates based on visible contents
- The system does not enforce penalties or restrict pickups

---

## Hackathon Scope

The project was designed to be:
- Demo-ready within a limited time frame
- Easy to understand for non-technical users
- Honest about technical and policy limitations

Potential future improvements include:
- City-specific sorting rules
- Improved image recognition models
- Persistent data storage
- Integration with real waste management systems

---

## Repository Contents

- Frontend application source code
- Demo logic and scoring rules
- GitHub Pages site for project overview
- Documentation and screenshots

---

## Acknowledgments

This project was developed as part of a sustainability-focused hackathon to explore practical, user-centered approaches to waste management challenges.
