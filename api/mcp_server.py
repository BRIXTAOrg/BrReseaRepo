"""BRIXTA read-only MCP server for ChatGPT and MCP-compatible clients.

Run one process per knowledge-base scope:

    BRIXTA_KNOWLEDGE_BASE_ID=<completed-job-id> python -m api.mcp_server

Production deployments must add authentication and expose this server through
an HTTPS endpoint before connecting it to ChatGPT.
"""

from __future__ import annotations

import os
from typing import Any, Literal, cast

from fastmcp import FastMCP
from pydantic import BaseModel

from runtime.knowledge import fetch_chunk, search_knowledge_base


class SearchResult(BaseModel):
    id: str
    title: str
    url: str


class SearchOutput(BaseModel):
    results: list[SearchResult]


class FetchOutput(BaseModel):
    id: str
    title: str
    text: str
    url: str
    metadata: dict[str, Any] | None = None


KNOWLEDGE_BASE_ID = os.getenv("BRIXTA_KNOWLEDGE_BASE_ID", "")
McpTransport = Literal["stdio", "http", "sse", "streamable-http"]
ALLOWED_TRANSPORTS: tuple[McpTransport, ...] = (
    "stdio",
    "http",
    "sse",
    "streamable-http",
)


def configured_transport() -> McpTransport:
    """Validate an environment value before passing it to FastMCP.

    ``os.getenv`` returns an unrestricted string, while FastMCP intentionally
    accepts a closed set of transport literals. Validation keeps configuration
    flexible without hiding invalid values from either Pylance or operators.
    """
    value = os.getenv("BRIXTA_MCP_TRANSPORT", "http").strip().lower()
    if value not in ALLOWED_TRANSPORTS:
        allowed = ", ".join(ALLOWED_TRANSPORTS)
        raise RuntimeError(
            f"Unsupported BRIXTA_MCP_TRANSPORT '{value}'. Choose one of: {allowed}."
        )
    return cast(McpTransport, value)

mcp = FastMCP(
    name="BRIXTA Knowledge",
    instructions=(
        "Search and fetch the completed BRIXTA knowledge base. "
        "Use search first, then fetch the most relevant results."
    ),
)


@mcp.tool(output_schema=SearchOutput.model_json_schema())
def search(query: str) -> SearchOutput:
    """Semantically search the configured BRIXTA knowledge base."""
    if not KNOWLEDGE_BASE_ID:
        raise ValueError("BRIXTA_KNOWLEDGE_BASE_ID is required.")
    matches = search_knowledge_base(KNOWLEDGE_BASE_ID, query, limit=8)
    return SearchOutput(
        results=[
            SearchResult(id=item["id"], title=item["title"], url=item["url"])
            for item in matches
        ]
    )


@mcp.tool(output_schema=FetchOutput.model_json_schema())
def fetch(id: str) -> FetchOutput:
    """Fetch the complete text and citation metadata for a search result."""
    if not KNOWLEDGE_BASE_ID:
        raise ValueError("BRIXTA_KNOWLEDGE_BASE_ID is required.")
    item = fetch_chunk(id, knowledge_base_id=KNOWLEDGE_BASE_ID)
    return FetchOutput(**item)


def main() -> None:
    if not KNOWLEDGE_BASE_ID:
        raise RuntimeError("Set BRIXTA_KNOWLEDGE_BASE_ID to a completed BRIXTA job ID.")
    mcp.run(
        transport=configured_transport(),
        host=os.getenv("BRIXTA_MCP_HOST", "0.0.0.0"),
        port=int(os.getenv("BRIXTA_MCP_PORT", "8001")),
    )


if __name__ == "__main__":
    main()