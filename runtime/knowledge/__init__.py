"""Knowledge-base discovery and semantic retrieval."""

from runtime.knowledge.service import (
    KnowledgeBaseError,
    describe_knowledge_base,
    fetch_chunk,
    list_knowledge_bases,
    search_knowledge_base,
)

__all__ = [
    "KnowledgeBaseError",
    "describe_knowledge_base",
    "fetch_chunk",
    "list_knowledge_bases",
    "search_knowledge_base",
]
