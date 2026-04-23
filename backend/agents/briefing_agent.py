import asyncio
import json
import logging
from openai import AsyncOpenAI
from ddgs import DDGS
from config import settings

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = """You are an astronomy briefing agent for AstroLens. Based on the NASA image information and web search results provided, synthesize a structured briefing.

Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{
  "mission_context": "2-3 sentences about the mission, spacecraft, telescope, or event depicted",
  "scientific_significance": "2-3 sentences about why this is scientifically important",
  "key_facts": ["concise fact 1", "concise fact 2", "concise fact 3", "concise fact 4", "concise fact 5"],
  "sources": [
    {"type": "web", "title": "source title", "url": "source url"}
  ]
}

Populate sources from the search results. If search results are empty, reference well-known authoritative sources (nasa.gov, etc.) by URL."""


async def _web_search(query: str) -> list[dict]:
    try:
        results = await asyncio.wait_for(
            asyncio.to_thread(lambda: list(DDGS().text(query, max_results=5))),
            timeout=5.0,
        )
        return [{"title": r["title"], "url": r["href"], "snippet": r["body"]} for r in results]
    except Exception as exc:
        logger.warning("web_search failed for %r: %s", query, exc)
        return []


async def generate_briefing(title: str, date: str, explanation: str) -> dict:
    # Run web search while building the prompt (single query, we decide it)
    query = f"{title} NASA astronomy"
    search_results = await _web_search(query)

    if search_results:
        search_context = "\n".join(
            f"- [{r['title']}]({r['url']}): {r['snippet'][:250]}"
            for r in search_results[:4]
        )
    else:
        search_context = "No web search results available."

    user_message = (
        f"Image: {title}\n"
        f"Date: {date}\n"
        f"NASA Caption: {explanation[:1200]}\n\n"
        f"Web Search Results:\n{search_context}"
    )

    response = await asyncio.wait_for(
        client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        ),
        timeout=8.0,
    )

    return json.loads(response.choices[0].message.content)
