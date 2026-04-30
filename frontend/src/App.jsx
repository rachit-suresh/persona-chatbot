import {
  BadgeCheck,
  Bot,
  Brain,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function normalizeApiBaseUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

const ENV_API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const DEFAULT_API_BASE_URL = import.meta.env.DEV ? "http://localhost:8000" : "";

const fallbackPersonas = [
  {
    id: "anshuman-singh",
    name: "Anshuman Singh",
    role: "Co-founder, InterviewBit and Scaler",
    bio: "A systems-minded mentor voice focused on structured practice and skill proof.",
    accent: "Calm, direct, practical",
    suggestions: [
      "How should I prepare for product company interviews?",
      "I am from a tier-3 college. What should I focus on?",
      "How do I use AI without weakening my fundamentals?",
    ],
  },
  {
    id: "abhimanyu-saxena",
    name: "Abhimanyu Saxena",
    role: "Co-founder, InterviewBit and Scaler",
    bio: "An entrepreneurial mentor voice focused on ownership, persistence, and action.",
    accent: "Energetic, candid, action-oriented",
    suggestions: [
      "How do I start building a startup idea?",
      "My marks are average. Can I still succeed in tech?",
      "How do I stop quitting courses midway?",
    ],
  },
  {
    id: "kshitij-mishra",
    name: "Kshitij Mishra",
    role: "Engineering educator, Scaler",
    bio: "A teacherly mentor voice focused on fundamentals, systems, and product judgment.",
    accent: "Thoughtful, precise, concept-first",
    suggestions: [
      "How do I learn system design from scratch?",
      "How can I make my projects stronger?",
      "Should I learn AI tools or core CS first?",
    ],
  },
];

const personaVisuals = {
  "anshuman-singh": {
    number: "01",
    color: "green",
    mode: "Systems Mentor",
    traits: ["DSA", "Interviews", "Skill proof"],
    opener: "Structured prep, crisp feedback, no vague motivation.",
  },
  "abhimanyu-saxena": {
    number: "02",
    color: "pink",
    mode: "Builder Coach",
    traits: ["Startups", "Ownership", "Momentum"],
    opener: "High energy guidance for ambition with discipline.",
  },
  "kshitij-mishra": {
    number: "03",
    color: "blue",
    mode: "Concept Teacher",
    traits: ["Systems", "AI", "Product thinking"],
    opener: "Deep explanations that connect tech choices to users.",
  },
};

function App() {
  const [personas, setPersonas] = useState(fallbackPersonas);
  const [activePersonaId, setActivePersonaId] = useState(fallbackPersonas[0].id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("gemini-3.1-flash-lite-preview");
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    const saved = window.localStorage?.getItem("persona-api-base-url");
    return normalizeApiBaseUrl(saved || ENV_API_BASE_URL || DEFAULT_API_BASE_URL);
  });
  const [apiDraft, setApiDraft] = useState(apiBaseUrl);
  const [backendStatus, setBackendStatus] = useState("checking");
  const endRef = useRef(null);

  const activePersona = useMemo(
    () => personas.find((persona) => persona.id === activePersonaId) || personas[0],
    [activePersonaId, personas]
  );
  const activeVisual = personaVisuals[activePersona.id] || personaVisuals["anshuman-singh"];

  useEffect(() => {
    async function loadPersonas() {
      if (!apiBaseUrl) {
        setBackendStatus("missing");
        setError("Backend URL is missing. Add VITE_API_BASE_URL in Vercel, then redeploy.");
        return;
      }

      setBackendStatus("checking");
      try {
        const response = await fetch(`${apiBaseUrl}/api/personas`);
        if (!response.ok) {
          throw new Error(`Backend returned HTTP ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data.personas) && data.personas.length > 0) {
          setPersonas(data.personas);
          setActivePersonaId(data.personas[0].id);
        }
        if (data.model) {
          setModel(data.model);
        }
        setError("");
        setBackendStatus("connected");
      } catch (requestError) {
        setBackendStatus("offline");
        setError(
          `Backend unreachable at ${apiBaseUrl}. Check Vercel VITE_API_BASE_URL, Render health, and Render FRONTEND_ORIGIN. ${requestError.message}`
        );
      }
    }

    loadPersonas();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (typeof endRef.current?.scrollIntoView === "function") {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  function switchPersona(personaId) {
    setActivePersonaId(personaId);
    setMessages([]);
    setInput("");
    setError("");
  }

  function resetChat() {
    setMessages([]);
    setInput("");
    setError("");
  }

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isTyping) return;

    if (!apiBaseUrl) {
      setError("Backend URL is missing. Add VITE_API_BASE_URL in Vercel, then redeploy.");
      return;
    }

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_id: activePersona.id,
          messages: nextMessages,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "The chatbot could not answer right now.");
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (requestError) {
      setError(requestError.message);
      setMessages(nextMessages);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <main className="app-shell">
      <section className={`workspace theme-${activeVisual.color}`} aria-label="Persona chatbot">
        <aside className="persona-panel" aria-label="Persona switcher">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden="true">
              <Bot size={28} />
            </span>
            <div>
              <p className="eyebrow">Prompt Lab</p>
              <h1>Persona Chatbot</h1>
            </div>
          </div>

          <div className="model-ticket" aria-label="Model status">
            <span>Model</span>
            <strong>{model.replace("gemini-", "Gemini ")}</strong>
          </div>

          <div className="persona-list" role="tablist" aria-label="Personas">
            {personas.map((persona, index) => {
              const visual = personaVisuals[persona.id] || personaVisuals["anshuman-singh"];
              return (
                <button
                  className={`persona-tab persona-${index + 1} ${persona.id === activePersona.id ? "active" : ""}`}
                  key={persona.id}
                  onClick={() => switchPersona(persona.id)}
                  role="tab"
                  aria-selected={persona.id === activePersona.id}
                >
                  <b>{visual.number}</b>
                  <span>{persona.name}</span>
                  <small>{persona.accent}</small>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="chat-panel">
          <header className="chat-header">
            <div>
              <p className="eyebrow">{activeVisual.mode}</p>
              <h2>{activePersona.name}</h2>
              <p>{activePersona.role}</p>
            </div>
            <button className="icon-button" onClick={resetChat} aria-label="Reset chat" title="Reset chat">
              <RefreshCw size={18} />
            </button>
          </header>

          <div className="persona-context">
            <div className="context-main">
              <Sparkles size={20} aria-hidden="true" />
              <span>{activePersona.bio}</span>
            </div>
            <div className="trait-strip" aria-label={`${activePersona.name} traits`}>
              {activeVisual.traits.map((trait) => (
                <span key={trait}>{trait}</span>
              ))}
            </div>
          </div>

          <div className="suggestions" aria-label={`${activePersona.name} suggestions`}>
            {activePersona.suggestions.map((suggestion) => (
              <button key={suggestion} onClick={() => sendMessage(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <div className="messages" aria-live="polite">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-badge">
                  <MessageCircle size={42} aria-hidden="true" />
                  <span>{activeVisual.number}</span>
                </div>
                <div className="empty-card">
                  <p>{activeVisual.opener}</p>
                  <div className="mini-metrics">
                    <span>
                      <BadgeCheck size={16} aria-hidden="true" />
                      Research-backed
                    </span>
                    <span>
                      <Brain size={16} aria-hidden="true" />
                      Persona prompt
                    </span>
                    <span>
                      <Zap size={16} aria-hidden="true" />
                      Fast mode
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                  <span>{message.role === "user" ? "You" : activePersona.name}</span>
                  <p>{message.content}</p>
                </article>
              ))
            )}

            {isTyping && (
              <article className="message assistant typing">
                <span>{activePersona.name}</span>
                <p>Thinking...</p>
              </article>
            )}
            <div ref={endRef} />
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form className="composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="chat-input">
              Message
            </label>
            <textarea
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Message ${activePersona.name}`}
              rows={1}
            />
            <button type="submit" disabled={isTyping || !input.trim()} aria-label="Send message">
              <Send size={18} />
              <span>Send</span>
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default App;
