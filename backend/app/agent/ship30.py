import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.retrieval.search import search_similar_chunks
# We can't trivially circular import `provider.py`'s chat_with_agent here if we need it. 
# So we will import the underlying LLM clients from provider or define them.
# Better to pass a generate_completion callback or just initialize an LLM call here.
from anthropic import AsyncAnthropicBedrock, AsyncAnthropic
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

SHIP30_SYSTEM_PROMPT = """You are an expert digital writer trained in the Ship 30 for 30 methodology.
Your task is to take the provided podcast transcript excerpts and transform them into a highly engaging, atomic essay.

Format Constraints:
- Strict length constraint: Between 200 and 300 words.
- Structure: 
  - A strong, punchy hook (first 1-2 sentences).
  - Skimmable structure (use short paragraphs, bold text for emphasis, or bullet points).
  - A single clear takeaway or conclusion at the end.
- Grounding: ONLY use facts and insights present in the provided transcript chunks. Do not hallucinate outside information.
- Tone: Engaging, direct, and actionable.
- Format: Return ONLY the Markdown of the essay. No conversational filler like "Here is your essay:".
"""

async def generate_ship30_essay(db: AsyncSession, topic: str) -> str:
    """
    Search for a topic in transcripts and generate a Ship 30 for 30 atomic essay.
    """
    logger.info(f"Generating Ship 30/30 essay for topic: {topic}")
    
    # 1. Retrieve context
    chunks = await search_similar_chunks(db, topic, top_k=3)
    if not chunks:
        return f"Cannot write essay. No relevant podcast transcripts found for topic: '{topic}'."
        
    context_text = "\n\n".join(f"[Episode: {c.source_episode}]\n{c.chunk_text}" for c in chunks)
    user_prompt = f"Topic: {topic}\n\nTranscript Excerpts:\n{context_text}\n\nWrite the Ship 30 for 30 essay now."
    
    # 2. Call LLM to generate essay
    # We duplicate a minimal LLM client here to avoid circular imports with provider.py
    # or we can refactor. For simplicity, we just instantiate the client.
    try:
        if settings.default_provider == "groq":
            client = AsyncOpenAI(api_key=settings.groq_api_key, base_url="https://api.groq.com/openai/v1")
            response = await client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": SHIP30_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ]
            )
            essay = response.choices[0].message.content
        else:
            if settings.claude_code_use_bedrock == "1":
                client = AsyncAnthropicBedrock(
                    aws_access_key=settings.aws_access_key_id,
                    aws_secret_key=settings.aws_secret_access_key,
                    aws_region=settings.aws_region,
                )
            else:
                client = AsyncAnthropic()
                
            response = await client.messages.create(
                model=settings.anthropic_model,
                system=SHIP30_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
                max_tokens=1000,
            )
            essay = next(b.text for b in response.content if b.type == "text")
            
        # 3. Return the essay wrapped in an artifact tag for the frontend to intercept
        # This fulfills Flow C (Artifact generation) in combination with Flow B
        return f"<artifact type=\"ship30_essay\" title=\"Ship 30/30 Essay: {topic}\">\n{essay}\n</artifact>"
        
    except Exception as e:
        logger.error(f"Failed to generate essay: {e}")
        return f"Error generating essay: {e}"
