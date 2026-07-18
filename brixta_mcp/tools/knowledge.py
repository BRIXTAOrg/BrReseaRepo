"""Tenant-safe knowledge discovery, search, and fetch tools."""

from __future__ import annotations

from typing import Any

from fastmcp import FastMCP
from pydantic import BaseModel, Field

from brixta_mcp.auth import READ_SCOPE, current_access_context
from runtime.knowledge import (
    KnowledgeAccessRepository,
    fetch_chunk,
    list_knowledge_bases,
    search_knowledge_base,
)


READ_SECURITY = {"securitySchemes": [{"type": "oauth2", "scopes": [READ_SCOPE]}]}
READ_ONLY_ANNOTATIONS = {
    "readOnlyHint": True,
    "destructiveHint": False,
    "idempotentHint": True,
    "openWorldHint": False,
}


class KnowledgeSummary(BaseModel):
    id: str
    tenant_id: str
    uri: str
    name: str
    source_type: str
    chunk_count: int
    embedding_model: str
    completed_at: str | None = None


class KnowledgeListOutput(BaseModel):
    knowledge_bases: list[KnowledgeSummary]


class SearchResult(BaseModel):
    id: str
    title: str
    url: str
    score: float
    snippet: str


class SearchOutput(BaseModel):
    results: list[SearchResult]


class FetchOutput(BaseModel):
    id: str
    title: str
    text: str
    url: str
    metadata: dict[str, Any] | None = None


def register_knowledge_tools(mcp: FastMCP) -> None:
    @mcp.tool(
        output_schema=KnowledgeListOutput.model_json_schema(),
        annotations=READ_ONLY_ANNOTATIONS,
        meta=READ_SECURITY,
    )
    def brixta_list_knowledge_bases(
        limit: int = 100,
        tenant_id: str | None = None,
    ) -> KnowledgeListOutput:
        """List ready knowledge bases across authorized tenants, or one tenant."""
        access = current_access_context()
        access.require(READ_SCOPE)
        capped = min(max(limit, 1), 200)
        items: list[dict[str, Any]] = []
        for selected in access.accessible_tenants(tenant_id):
            items.extend(
                KnowledgeAccessRepository.filter_enabled(
                    selected,
                    list_knowledge_bases(tenant_id=selected, limit=capped),
                )
            )
        items.sort(key=lambda item: item.get("completed_at") or "", reverse=True)
        return KnowledgeListOutput(
            knowledge_bases=[KnowledgeSummary(**item) for item in items[:capped]]
        )

    @mcp.tool(
        output_schema=SearchOutput.model_json_schema(),
        annotations=READ_ONLY_ANNOTATIONS,
        meta=READ_SECURITY,
    )
    def brixta_search(
        query: str = Field(min_length=1, max_length=4000),
        knowledge_base_id: str = Field(min_length=1),
        limit: int = 8,
        tenant_id: str | None = None,
    ) -> SearchOutput:
        """Semantically search one authorized BRIXTA knowledge base."""
        access = current_access_context()
        access.require(READ_SCOPE)
        selected = access.tenant_for(tenant_id)
        if not KnowledgeAccessRepository.is_enabled(selected, knowledge_base_id):
            raise PermissionError("This knowledge base is disabled for MCP access.")
        matches = search_knowledge_base(
            knowledge_base_id,
            query,
            limit=min(max(limit, 1), 20),
            tenant_id=selected,
        )
        return SearchOutput(
            results=[
                SearchResult(
                    id=item["id"],
                    title=item["title"],
                    url=item["url"],
                    score=item["score"],
                    snippet=item["text"][:600],
                )
                for item in matches
            ]
        )

    @mcp.tool(
        output_schema=FetchOutput.model_json_schema(),
        annotations=READ_ONLY_ANNOTATIONS,
        meta=READ_SECURITY,
    )
    def brixta_get_chunk(result_id: str, tenant_id: str | None = None) -> FetchOutput:
        """Fetch complete text and citation metadata for a BRIXTA search result."""
        access = current_access_context()
        access.require(READ_SCOPE)
        selected = access.tenant_for(tenant_id)
        knowledge_base_id = result_id.rsplit(":", 1)[0]
        if not KnowledgeAccessRepository.is_enabled(selected, knowledge_base_id):
            raise PermissionError("This knowledge base is disabled for MCP access.")
        item = fetch_chunk(result_id, tenant_id=selected)
        return FetchOutput(**item)
