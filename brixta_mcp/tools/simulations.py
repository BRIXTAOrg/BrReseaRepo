"""Tenant-safe Structural & Material Lab result tools."""

from __future__ import annotations

from typing import Any

from fastmcp import FastMCP
from pydantic import BaseModel

from brixta_mcp.auth import READ_SCOPE, current_access_context
from runtime.simulations.repository import SimulationRunRepository


READ_SECURITY = {"securitySchemes": [{"type": "oauth2", "scopes": [READ_SCOPE]}]}
READ_ONLY_ANNOTATIONS = {
    "readOnlyHint": True,
    "destructiveHint": False,
    "idempotentHint": True,
    "openWorldHint": False,
}


class SimulationRunSummary(BaseModel):
    id: str
    tenant_id: str
    label: str | None = None
    case_card_id: str
    solver: str
    execution_mode: str
    status: str
    created_at: str | None = None
    completed_at: str | None = None


class SimulationRunListOutput(BaseModel):
    runs: list[SimulationRunSummary]


class SimulationReportOutput(BaseModel):
    id: str
    case_card_id: str
    status: str
    summary: dict[str, Any] | None = None
    evidence: list[dict[str, Any]]
    artifacts: list[dict[str, Any]]
    error: str | None = None


def register_simulation_tools(mcp: FastMCP) -> None:
    @mcp.tool(
        output_schema=SimulationRunListOutput.model_json_schema(),
        annotations=READ_ONLY_ANNOTATIONS,
        meta=READ_SECURITY,
    )
    def brixta_list_simulation_runs(
        limit: int = 50,
        tenant_id: str | None = None,
    ) -> SimulationRunListOutput:
        """List simulation runs across authorized tenants, or one tenant."""
        access = current_access_context()
        access.require(READ_SCOPE)
        capped = min(max(limit, 1), 200)
        runs = []
        for selected in access.accessible_tenants(tenant_id):
            runs.extend(SimulationRunRepository.list(tenant_id=selected, limit=capped))
        runs.sort(key=lambda item: item.get("created_at") or "", reverse=True)
        return SimulationRunListOutput(
            runs=[SimulationRunSummary(**run) for run in runs[:capped]]
        )

    @mcp.tool(
        output_schema=SimulationReportOutput.model_json_schema(),
        annotations=READ_ONLY_ANNOTATIONS,
        meta=READ_SECURITY,
    )
    def brixta_get_simulation_report(
        run_id: str,
        tenant_id: str | None = None,
    ) -> SimulationReportOutput:
        """Fetch one completed or failed simulation record with evidence and artifacts."""
        access = current_access_context()
        access.require(READ_SCOPE)
        selected = access.tenant_for(tenant_id)
        run = SimulationRunRepository.get(run_id, tenant_id=selected)
        if run is None:
            raise ValueError("Simulation run not found.")
        return SimulationReportOutput(**run)
