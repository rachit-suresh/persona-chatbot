from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.personas import PERSONAS


client = TestClient(app)


def test_personas_are_distinct():
    assert set(PERSONAS) == {
        "anshuman-singh",
        "abhimanyu-saxena",
        "kshitij-mishra",
    }
    prompts = {persona.system_prompt for persona in PERSONAS.values()}
    assert len(prompts) == 3
    for persona in PERSONAS.values():
        assert "Few-shot examples" in persona.system_prompt
        assert "Internal reasoning instruction" in persona.system_prompt


def test_personas_endpoint_returns_suggestions():
    response = client.get("/api/personas")
    assert response.status_code == 200
    personas = response.json()["personas"]
    assert len(personas) == 3
    assert all(persona["suggestions"] for persona in personas)
    assert response.json()["model"] == get_settings().gemini_model


def test_missing_api_key_is_user_friendly(monkeypatch):
    monkeypatch.setattr(
        "app.main.get_settings",
        lambda: SimpleNamespace(
            gemini_api_key=None,
            openai_base_url="http://example.test",
            gemini_model="gemini-3.1-flash-lite-preview",
            gemini_reasoning_effort="low",
        ),
    )
    response = client.post(
        "/api/chat",
        json={
            "persona_id": "anshuman-singh",
            "messages": [{"role": "user", "content": "Hello"}],
        },
    )
    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.json()["detail"]


def test_chat_injects_selected_system_prompt(monkeypatch):
    captured = {}

    class FakeCompletions:
        def create(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(content="A persona-style answer")
                    )
                ]
            )

    class FakeClient:
        chat = SimpleNamespace(completions=FakeCompletions())

    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
    monkeypatch.setenv("GEMINI_REASONING_EFFORT", "low")
    monkeypatch.setattr("app.main.build_client", lambda: FakeClient())
    get_settings.cache_clear()

    response = client.post(
        "/api/chat",
        json={
            "persona_id": "kshitij-mishra",
            "messages": [{"role": "user", "content": "Explain system design"}],
        },
    )

    assert response.status_code == 200
    assert response.json()["reply"] == "A persona-style answer"
    assert captured["messages"][0]["role"] == "system"
    assert PERSONAS["kshitij-mishra"].system_prompt == captured["messages"][0]["content"]
    assert captured["messages"][1] == {
        "role": "user",
        "content": "Explain system design",
    }
    assert captured["model"] == "gemini-3.1-flash-lite-preview"
    assert captured["reasoning_effort"] == "low"
    get_settings.cache_clear()


def test_unknown_persona_returns_404():
    response = client.post(
        "/api/chat",
        json={
            "persona_id": "unknown",
            "messages": [{"role": "user", "content": "Hello"}],
        },
    )
    assert response.status_code == 404
