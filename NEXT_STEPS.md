# What Is Done And What To Do Next

## What Is Done

- The project is now organized under this folder: `persona-based-chatbot`.
- `backend/` contains the FastAPI API with Gemini 3.1 Flash-Lite Preview through Gemini's OpenAI-compatible chat endpoint.
- `frontend/` contains the React/Vite chatbot UI.
- The UI has all required assignment behavior:
  - Three persona tabs.
  - Active persona is always visible.
  - Conversation resets when switching personas.
  - Suggestion chips per persona.
  - Typing indicator.
  - Friendly API error display.
  - Mobile-responsive layout.
- `Chrome.md` contains the research evidence log.
- `prompts.md` contains annotated prompts for all three personas.
- `reflection.md` contains the 300-500 word reflection.
- `.env.example` documents required environment variables.
- `render.yaml` is ready for Render backend deployment.
- `frontend/vercel.json` is ready for Vercel frontend deployment.
- Automated checks are included for both backend and frontend.

## What You Need To Do Next

1. Create your local environment file:

```bash
cd persona-based-chatbot
copy .env.example .env
```

2. Open `.env` and paste your Gemini API key:

```env
GEMINI_API_KEY=your_real_key_here
GEMINI_MODEL=gemini-3.1-flash-lite-preview
GEMINI_REASONING_EFFORT=low
```

3. Run the backend locally:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

4. Run the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

5. Open the app:

```text
http://localhost:5173
```

## Test Before Submission

From `persona-based-chatbot/backend`:

```bash
python -m pytest
```

From `persona-based-chatbot/frontend`:

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

From `persona-based-chatbot`:

```bash
python scripts/research_personas.py --no-search
```

## Deployment Checklist

1. Push the `persona-based-chatbot` folder contents to a public GitHub repo.
2. Deploy the backend on Render:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add `GEMINI_API_KEY` in Render environment variables.
   - Keep `GEMINI_MODEL=gemini-3.1-flash-lite-preview`.
   - Keep `GEMINI_REASONING_EFFORT=low`.
3. Deploy the frontend on Vercel:
   - Root directory: `frontend`
   - Environment variable: `VITE_API_BASE_URL=https://your-render-backend-url`
4. In Render, set:

```env
FRONTEND_ORIGIN=https://your-vercel-url
```

5. Update `README.md` with:
   - Public GitHub repo link.
   - Live Vercel project URL.
   - Render backend URL.
   - Screenshot path or screenshot section if your instructor expects one.

## Files To Submit

- GitHub repository URL.
- Live Vercel frontend URL.
- Make sure the repo includes:
  - `README.md`
  - `Chrome.md`
  - `prompts.md`
  - `reflection.md`
  - `.env.example`
  - `backend/`
  - `frontend/`

Do not commit `.env` or any real API key.
