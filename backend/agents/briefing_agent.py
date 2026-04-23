import asyncio
import json
import logging
from openai import AsyncOpenAI
from ddgs import DDGS
from config import settings

logger = logging.getLogger(__name__)
client = AsyncOpenAI(api_key=settings.openai_api_key)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for NASA mission context, scientific background, and discovery history",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    }
]

SYSTEM_PROMPT = """You are an astronomy briefing agent for AstroLens. You will receive a NASA image title, date, and NASA's own caption.

Use the web_search tool to find mission context, scientific background, and discovery history before writing your response.

Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{
  "mission_context": "2-3 sentences about the mission, spacecraft, telescope, or event depicted",
  "scientific_significance": "2-3 sentences about why this is scientifically important",
  "key_facts": ["concise fact 1", "concise fact 2", "concise fact 3", "concise fact 4", "concise fact 5"],
  "sources": [
    {"type": "web", "title": "source title", "url": "source url"}
  ]
}

Include all sources that were useful. Minimum 3 sources total."""


async def _web_search(query: str) -> list[dict]:
    try:
        results = await asyncio.to_thread(
            lambda: list(DDGS().text(query, max_results=5))
        )
        return [{"title": r["title"], "url": r["href"], "snippet": r["body"]} for r in results]
    except Exception as exc:
        logger.warning("web_search failed for %r: %s", query, exc)
        return []


async def _dispatch_tool(tool_call) -> list[dict]:
    args = json.loads(tool_call.function.arguments)
    return await _web_search(args["query"])


async def generate_briefing(title: str, date: str, explanation: str) -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Title: {title}\nDate: {date}\nNASA Caption: {explanation}"},
    ]

    # Pass 1: GPT-4o decides tool calls
    r1 = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=TOOLS,
        tool_choice="required",
    )

    tool_calls = r1.choices[0].message.tool_calls
    messages.append(r1.choices[0].message)

    # Execute all tool calls concurrently
    results = await asyncio.gather(
        *[_dispatch_tool(tc) for tc in tool_calls],
        return_exceptions=True,
    )

    for tc, result in zip(tool_calls, results):
        content = json.dumps(result) if not isinstance(result, Exception) else "[]"
        messages.append({"role": "tool", "tool_call_id": tc.id, "content": content})

    # Pass 2: synthesize into Briefing JSON
    r2 = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        response_format={"type": "json_object"},
    )

    return json.loads(r2.choices[0].message.content)
