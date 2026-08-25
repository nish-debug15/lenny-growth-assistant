import json
import logging
from typing import List

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import SEARCH_TOOL, SHIP30_TOOL
from app.db.repositories.messages import get_messages_by_session, create_message
from app.retrieval.search import search_similar_chunks
from app.agent.ship30 import generate_ship30_essay

logger = logging.getLogger(__name__)

# Initialize clients
openai_client = AsyncOpenAI(
    api_key=settings.groq_api_key,
    base_url="https://api.groq.com/openai/v1"
)

# Direct Anthropic client (no Bedrock)
anthropic_client = None
if settings.anthropic_api_key:
    anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

async def execute_tool(db: AsyncSession, tool_name: str, arguments: dict) -> str:
    """Execute a local tool by name."""
    if tool_name == "search_transcripts":
        query = arguments.get("query", "")
        chunks = await search_similar_chunks(db, query)
        if not chunks:
            return "No relevant information found in transcripts."
        
        # Format the retrieved chunks for the LLM
        formatted = []
        for c in chunks:
            formatted.append(f"[Episode: {c.source_episode}]\n{c.chunk_text}")
        return "\n\n---\n\n".join(formatted)
        
    elif tool_name == "generate_ship30_essay":
        topic = arguments.get("topic", "")
        essay = await generate_ship30_essay(db, topic)
        return essay
    
    return f"Unknown tool: {tool_name}"


async def generate_response_groq(db: AsyncSession, messages: list) -> str:
    """Generate a response using Groq (OpenAI compatible)."""
    # Convert local message format to OpenAI format
    oai_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in messages:
        oai_messages.append({"role": m.role, "content": m.content})
        
    # Tool definitions for OpenAI format
    tools = [
        {"type": "function", "function": SEARCH_TOOL},
        {"type": "function", "function": SHIP30_TOOL}
    ]
    
    logger.info(f"Calling Groq model: {settings.groq_model}")
    response = await openai_client.chat.completions.create(
        model=settings.groq_model,
        messages=oai_messages,
        tools=tools,
        tool_choice="auto"
    )
    
    msg = response.choices[0].message
    if msg.tool_calls:
        # For simplicity in this demo, we handle only the first tool call sequentially.
        # In a robust agent, this would be a loop.
        tool_call = msg.tool_calls[0]
        args = json.loads(tool_call.function.arguments)
        logger.info(f"Groq decided to call tool {tool_call.function.name} with args {args}")
        
        tool_result = await execute_tool(db, tool_call.function.name, args)
        
        oai_messages.append(msg)
        oai_messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "name": tool_call.function.name,
            "content": tool_result
        })
        
        # Second call with tool results — force no further tool calls
        second_response = await openai_client.chat.completions.create(
            model=settings.groq_model,
            messages=oai_messages,
            tools=tools,
            tool_choice="none",
        )
        return second_response.choices[0].message.content
        
    return msg.content


async def generate_response_anthropic(db: AsyncSession, messages: list) -> str:
    """Generate a response using Anthropic (via Bedrock or Direct)."""
    anthropic_messages = []
    for m in messages:
        anthropic_messages.append({"role": m.role, "content": m.content})
        
    # Tool definitions for Anthropic format
    tools = [
        {
            "name": SEARCH_TOOL["name"],
            "description": SEARCH_TOOL["description"],
            "input_schema": SEARCH_TOOL["parameters"]
        },
        {
            "name": SHIP30_TOOL["name"],
            "description": SHIP30_TOOL["description"],
            "input_schema": SHIP30_TOOL["parameters"]
        }
    ]
    
    logger.info(f"Calling Anthropic model: {settings.anthropic_model}")
    response = await anthropic_client.messages.create(
        model=settings.anthropic_model,
        system=SYSTEM_PROMPT,
        messages=anthropic_messages,
        tools=tools,
        max_tokens=1024,
    )
    
    # Check if a tool was called
    if response.stop_reason == "tool_use":
        tool_use = next(b for b in response.content if b.type == "tool_use")
        logger.info(f"Anthropic decided to call tool {tool_use.name} with args {tool_use.input}")
        
        tool_result = await execute_tool(db, tool_use.name, tool_use.input)
        
        anthropic_messages.append({"role": "assistant", "content": response.content})
        anthropic_messages.append({
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": tool_result
                }
            ]
        })
        
        # Second call with tool results
        second_response = await anthropic_client.messages.create(
            model=settings.anthropic_model,
            system=SYSTEM_PROMPT,
            messages=anthropic_messages,
            max_tokens=1024,
        )
        # Extract text content
        return next(b.text for b in second_response.content if b.type == "text")
        
    # Just return text
    return next(b.text for b in response.content if b.type == "text")


async def chat_with_agent(db: AsyncSession, session_id: str, user_message: str) -> str:
    """Main entrypoint for chat: saves message, calls agent, saves response."""
    # 1. Save user message
    await create_message(db, session_id, "user", user_message)
    
    # 2. Get history (limited for context window, e.g. last 10 messages)
    history = await get_messages_by_session(db, session_id)
    history = history[-10:]
    
    # 3. Call LLM with Fallback
    try:
        if settings.default_provider == "groq":
            try:
                response_text = await generate_response_groq(db, history)
            except Exception as e:
                logger.warning(f"Groq failed ({e}), trying Anthropic fallback...")
                if anthropic_client:
                    response_text = await generate_response_anthropic(db, history)
                else:
                    raise
        else:
            try:
                import asyncio
                response_text = await asyncio.wait_for(
                    generate_response_anthropic(db, history),
                    timeout=settings.bedrock_timeout_seconds
                )
            except (Exception, asyncio.TimeoutError) as e:
                logger.warning(f"Anthropic failed ({e}), falling back to Groq...")
                response_text = await generate_response_groq(db, history)
    except Exception as e:
        logger.error(f"Both LLM providers failed: {e}", exc_info=True)
        response_text = "I'm sorry, I encountered an error while communicating with the AI models. Please try again later."
        
    # 4. Sanitize the response to prevent XSS (especially in artifacts)
    from app.agent.sanitizer import sanitize_artifact_html
    response_text = sanitize_artifact_html(response_text)
    
    # 5. Save AI response
    await create_message(db, session_id, "assistant", response_text)
    
    return response_text
