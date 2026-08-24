SEARCH_TOOL = {
    "name": "search_transcripts",
    "description": "Search Lenny's Podcast transcripts for relevant chunks about a topic, product growth, or management. Returns text chunks.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query to match against podcast transcripts."
            }
        },
        "required": ["query"]
    }
}

SHIP30_TOOL = {
    "name": "generate_ship30_essay",
    "description": "Generate a Ship 30 for 30 style atomic essay about a specific topic based on podcast transcripts. Produces a ~250-300 word essay with a strong hook, skimmable structure, and single takeaway.",
    "parameters": {
        "type": "object",
        "properties": {
            "topic": {
                "type": "string",
                "description": "The specific topic or concept to write the essay about."
            }
        },
        "required": ["topic"]
    }
}
