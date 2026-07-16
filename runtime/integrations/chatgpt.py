"""Truthful ChatGPT handoff state for the shared MCP gateway.

BRIXTA can prepare tenant-scoped access and open ChatGPT's plugin settings. It
cannot sign into a user's OpenAI account, create a developer-mode app on their
behalf, or manufacture an approval email. Those actions remain inside ChatGPT.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


STATE_PATH = Path(".brixta/connection.json")
CHATGPT_SETTINGS_URL = "https://chatgpt.com/plugins"


def _read_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {}
    try:
        value = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return value if isinstance(value, dict) else {}


def _process_alive(value: object) -> bool:
    if isinstance(value, bool):
        return False
    try:
        process_id = int(value) if isinstance(value, (int, str)) else 0
    except ValueError:
        return False
    if process_id <= 0:
        return False
    try:
        os.kill(process_id, 0)
        return True
    except (OSError, OverflowError):
        return False


def chatgpt_connection_status() -> dict[str, Any]:
    """Describe gateway readiness without claiming ChatGPT account linkage."""
    state = _read_state()
    mcp_url = str(
        state.get("mcp_url") or os.getenv("BRIXTA_MCP_PUBLIC_URL", "")
    ).strip().rstrip("/")
    auth_mode = str(
        state.get("auth_mode") or os.getenv("BRIXTA_MCP_AUTH_MODE", "")
    ).strip().lower()
    mode = str(state.get("mode") or "production")
    public_https = mcp_url.startswith("https://") and mcp_url.endswith("/mcp")
    discoverable_auth = auth_mode in {"oauth-local", "jwt"}
    locally_managed = mode in {"local", "local-chatgpt"}
    local_gateway_alive = _process_alive(state.get("mcp_pid"))
    local_tunnel_alive = _process_alive(state.get("tunnel_pid"))
    gateway_available = (
        public_https
        and discoverable_auth
        and (
            local_gateway_alive and local_tunnel_alive
            if locally_managed
            else True
        )
    )

    issues: list[str] = []
    if not public_https:
        issues.append("Configure one public HTTPS MCP URL ending in /mcp.")
    if not discoverable_auth:
        issues.append("Configure OAuth 2.1 discovery (JWT mode in production).")
    if locally_managed and not local_gateway_alive:
        issues.append("The locally managed MCP gateway is not running.")
    if locally_managed and not local_tunnel_alive:
        issues.append("The locally managed secure tunnel is not running.")

    distribution = os.getenv("BRIXTA_CHATGPT_DISTRIBUTION", "developer").strip().lower()
    if distribution not in {"developer", "published"}:
        distribution = "developer"
    return {
        "gateway_available": gateway_available,
        "gateway_configured": public_https and discoverable_auth,
        "mode": mode,
        "mcp_url": mcp_url or None,
        "auth_mode": auth_mode or None,
        "authenticated": discoverable_auth,
        "shared_gateway": True,
        "distribution": distribution,
        "chatgpt_settings_url": os.getenv(
            "BRIXTA_CHATGPT_CONNECT_URL", CHATGPT_SETTINGS_URL
        ),
        "manual_app_creation_required": distribution == "developer",
        "approval_location": "chatgpt",
        "email_approval_available": False,
        "chatgpt_account_connected": None,
        "issues": issues,
    }


def chatgpt_handoff(
    *,
    knowledge_base_id: str,
    tenant_id: str,
    access_enabled: bool,
) -> dict[str, Any]:
    connection = chatgpt_connection_status()
    if connection["manual_app_creation_required"]:
        final_step = (
            "In ChatGPT, enable Developer mode, create a developer-mode app, "
            "paste the MCP URL, and approve OAuth once."
        )
    else:
        final_step = (
            "Open the published BRIXTA plugin in ChatGPT and approve OAuth once."
        )
    return {
        "knowledge_base_id": knowledge_base_id,
        "tenant_id": tenant_id,
        "access_enabled": access_enabled,
        "connection": connection,
        "steps": [
            "Allow this knowledge base on the tenant-scoped shared gateway.",
            "Open ChatGPT and sign in if the browser asks.",
            final_step,
            "Start a new chat, choose BRIXTA from the tool picker, and ask a question.",
        ],
    }
