# Reflection

This assignment made the GIGO principle feel very real. A shallow prompt like "act like a founder" gives the model almost nothing to hold on to, so the output becomes generic motivation. The better approach was to collect public evidence first, then translate that evidence into prompt decisions: background, values, communication style, examples, output rules, and constraints. That helped each persona become distinct without pretending the chatbot has private access to the real person.

What worked best was separating research from prompting. The `Chrome.md` file keeps the source trail visible, and `prompts.md` explains why the prompt choices were made. This made the system prompts easier to audit. It also forced the chatbot to stay professional: the personas are inspired by real public communication, but the assistant is instructed not to claim it is the real person or invent private facts.

The main technical lesson was that the UI and backend both need to respect the prompt boundary. The frontend resets the conversation when the persona changes, so messages from one persona do not leak into another. The backend owns the system prompt injection, which prevents the browser from becoming the source of truth for important behavior. Environment variables also matter because a hardcoded API key would make the project unsafe to publish.

If I improved this further, I would add more first-party research from talks, class notes, and public videos, then run more evaluation conversations with people who actually know these personalities. I would also add streaming responses and a small admin tool to update persona prompts without editing code.
