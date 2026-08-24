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
