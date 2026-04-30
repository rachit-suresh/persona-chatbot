"""Collect public persona research into Chrome.md.

The script is intentionally person-agnostic. Add people, search terms, and
manual URLs to research/personas.yaml, then run:

    python scripts/research_personas.py

If SERPAPI_API_KEY is present, the script records Google-style search results.
Manual URLs are always fetched where possible, which keeps the workflow usable
when search APIs or login-gated pages are unavailable.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "research" / "personas.yaml"
DEFAULT_OUTPUT = ROOT / "Chrome.md"


@dataclass
class SourceNote:
    label: str
    url: str
    note: str


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip = False
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript", "svg"}:
            self._skip = True

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript", "svg"}:
            self._skip = False

    def handle_data(self, data: str) -> None:
        if not self._skip:
            cleaned = " ".join(data.split())
            if cleaned:
                self.parts.append(cleaned)


def fetch_json(url: str) -> dict[str, Any]:
    with urllib.request.urlopen(url, timeout=20) as response:
        return json.loads(response.read().decode("utf-8", errors="replace"))


def fetch_text(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 persona-research-bot/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        raw = response.read().decode("utf-8", errors="replace")
    parser = TextExtractor()
    parser.feed(raw)
    return html.unescape(" ".join(parser.parts))


def summarize(text: str, person_name: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return "No extractable text was available from this source."

    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    preferred = [
        sentence
        for sentence in sentences
        if person_name.lower() in sentence.lower()
        or "scaler" in sentence.lower()
        or "interviewbit" in sentence.lower()
        or "education" in sentence.lower()
        or "engineer" in sentence.lower()
    ]
    selected = preferred[:3] or sentences[:3]
    note = " ".join(selected)
    return textwrap.shorten(note, width=520, placeholder="...")


def serpapi_search(query: str, api_key: str) -> list[SourceNote]:
    params = urllib.parse.urlencode(
        {
            "engine": "google",
            "q": query,
            "api_key": api_key,
            "num": 5,
        }
    )
    data = fetch_json(f"https://serpapi.com/search.json?{params}")
    notes = []
    for result in data.get("organic_results", [])[:5]:
        title = result.get("title") or "Search result"
        link = result.get("link") or ""
        snippet = result.get("snippet") or "No snippet returned."
        if link:
            notes.append(SourceNote(label=title, url=link, note=snippet))
    return notes


def load_config(path: Path) -> dict[str, Any]:
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "PyYAML is required for research/personas.yaml. Install with: pip install pyyaml"
        ) from exc

    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def collect_persona(persona: dict[str, Any], use_search: bool) -> list[SourceNote]:
    person_name = persona["name"]
    notes: list[SourceNote] = []

    api_key = os.getenv("SERPAPI_API_KEY")
    if use_search and api_key:
        for query in persona.get("search_terms", []):
            try:
                notes.extend(serpapi_search(query, api_key))
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
                notes.append(SourceNote("Search error", query, f"Search failed: {exc}"))

    for label, url in (persona.get("manual_urls") or {}).items():
        try:
            text = fetch_text(url)
            notes.append(SourceNote(label=label, url=url, note=summarize(text, person_name)))
        except (urllib.error.URLError, TimeoutError, UnicodeError) as exc:
            notes.append(SourceNote(label=label, url=url, note=f"Fetch failed: {exc}"))

    seen = set()
    unique_notes = []
    for note in notes:
        key = note.url
        if key not in seen:
            seen.add(key)
            unique_notes.append(note)
    return unique_notes


def render_markdown(config: dict[str, Any], use_search: bool) -> str:
    lines = [
        "# Chrome Research Log",
        "",
        "This file records public research used to shape the three persona prompts. It can be regenerated with `python scripts/research_personas.py`.",
        "",
        "Research boundaries: public pages only, no private messages, no login-only scraping, and no claims treated as fact unless the source is listed here.",
        "",
    ]

    for persona in config.get("personas", []):
        lines.extend([f"## {persona['name']}", ""])
        for note in collect_persona(persona, use_search):
            lines.extend(
                [
                    f"### {note.label}",
                    f"- URL: {note.url}",
                    f"- Extracted note: {note.note}",
                    "",
                ]
            )

    return "\n".join(lines).strip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--no-search", action="store_true", help="Skip SerpAPI lookup.")
    args = parser.parse_args()

    config = load_config(args.config)
    markdown = render_markdown(config, use_search=not args.no_search)
    args.output.write_text(markdown, encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
