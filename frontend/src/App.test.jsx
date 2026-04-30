import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

const personasPayload = {
  personas: [
    {
      id: "anshuman-singh",
      name: "Anshuman Singh",
      role: "Co-founder, InterviewBit and Scaler",
      bio: "Systems mentor",
      accent: "Calm",
      suggestions: ["Prepare for interviews?"],
    },
    {
      id: "abhimanyu-saxena",
      name: "Abhimanyu Saxena",
      role: "Co-founder, InterviewBit and Scaler",
      bio: "Startup mentor",
      accent: "Energetic",
      suggestions: ["Build a startup?"],
    },
    {
      id: "kshitij-mishra",
      name: "Kshitij Mishra",
      role: "Engineering educator, Scaler",
      bio: "Systems teacher",
      accent: "Precise",
      suggestions: ["Learn system design?"],
    },
  ],
};

function mockFetch(chatReply = "Mock persona reply") {
  global.fetch = vi.fn((url) => {
    if (String(url).includes("/api/personas")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(personasPayload),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ reply: chatReply }),
    });
  });
}

beforeEach(() => {
  mockFetch();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders all persona tabs", async () => {
    render(<App />);
    expect(await screen.findByRole("tab", { name: /Anshuman Singh/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Abhimanyu Saxena/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Kshitij Mishra/i })).toBeInTheDocument();
  });

  it("sends a suggestion chip and shows the response", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Prepare for interviews?" }));
    expect(await screen.findByText("Mock persona reply")).toBeInTheDocument();
  });

  it("resets the conversation when switching personas", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Prepare for interviews?" }));
    expect(await screen.findByText("Mock persona reply")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Abhimanyu Saxena/i }));
    expect(screen.queryByText("Mock persona reply")).not.toBeInTheDocument();
  });

  it("shows loading and friendly API errors", async () => {
    let rejectChat;
    global.fetch = vi.fn((url) => {
      if (String(url).includes("/api/personas")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(personasPayload),
        });
      }
      return new Promise((_, reject) => {
        rejectChat = reject;
      });
    });

    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByLabelText("Message"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("Thinking...")).toBeInTheDocument();
    rejectChat(new Error("Network failed"));
    await waitFor(() => expect(screen.getByText("Network failed")).toBeInTheDocument());
  });
});
