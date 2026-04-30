# Persona-Based AI Chatbot

A full-stack Gen AI assignment project for a persona-based chatbot with three Scaler/InterviewBit personalities: Anshuman Singh, Abhimanyu Saxena, and Kshitij Mishra.

## Features

- React/Vite chat interface with persona tabs.
- Conversation resets whenever the active persona changes.
- Per-persona suggestion chips.
- Typing indicator and friendly API errors.
- FastAPI backend that injects the selected persona system prompt.
- Gemini 3.1 Flash-Lite Preview used through the OpenAI-compatible Chat Completions interface.
- Research log, annotated prompts, and reflection files included for submission.

## Project Structure

```text
backend/              FastAPI API and tests
frontend/             React/Vite app and tests
research/             Person-agnostic research config
scripts/              Research automation script
Chrome.md             Research evidence log
prompts.md            Annotated system prompts
reflection.md         300-500 word assignment reflection
render.yaml           Render backend blueprint
```

## Local Setup

Create the environment file:

```bash
cp .env.example .env
```

Set `GEMINI_API_KEY` in `.env`.

For the frontend, the default local API URL is already `http://localhost:8000`. If you need to override it, create `frontend/.env` from `frontend/.env.example`.

Install and run the backend:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Install and run the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

For Vercel, set `VITE_API_BASE_URL` to your Render backend URL so the deployed frontend can reach the API.

## Tests

Backend:

```bash
cd backend
python -m pytest
```

Frontend:

```bash
cd frontend
npm test
npm run build
```

## Research Script

The script reads `research/personas.yaml` and writes `Chrome.md`.

```bash
python -m pip install pyyaml
python scripts/research_personas.py
```

With `SERPAPI_API_KEY`, it also records Google-style search results. Without it, the script uses the manual URLs in the YAML file.
