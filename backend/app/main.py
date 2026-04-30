from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError

from .config import get_settings
from .personas import get_persona, public_personas
from .schemas import ChatRequest, ChatResponse


app = FastAPI(
    title="Persona-Based AI Chatbot API",
    version="1.0.0",
)

settings = get_settings()
allowed_origins = [
    origin.strip()
    for origin in settings.frontend_origin.split(",")
    if origin.strip()
]
allowed_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_client() -> OpenAI:
    current = get_settings()
    if not current.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="The chatbot is not configured yet. Add GEMINI_API_KEY to the backend environment.",
        )
    return OpenAI(api_key=current.gemini_api_key, base_url=current.openai_base_url)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/personas")
def personas() -> dict[str, object]:
    return {"personas": public_personas(), "model": get_settings().gemini_model}


@app.post("/api/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    persona = get_persona(payload.persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Unknown persona selected.")

    messages = [{"role": "system", "content": persona.system_prompt}]
    messages.extend(message.model_dump() for message in payload.messages)

    try:
        client = build_client()
        response = client.chat.completions.create(
            model=get_settings().gemini_model,
            messages=messages,
            reasoning_effort=get_settings().gemini_reasoning_effort,
            temperature=0.75,
            max_tokens=800,
        )
    except HTTPException:
        raise
    except OpenAIError:
        raise HTTPException(
            status_code=502,
            detail="The AI service could not answer right now. Please try again in a moment.",
        )

    reply = response.choices[0].message.content if response.choices else None
    if not reply:
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an empty answer. Please try again.",
        )

    return ChatResponse(reply=reply)
