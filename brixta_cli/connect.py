"""BRIXTA MCP startup and client handoff workflows."""

from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
import webbrowser
from typing import Any
from urllib.parse import urlparse

from brixta_cli.config import (
    STATE_DIR,
    load_state,
    process_alive,
    save_state,
    update_state,
    utc_now,
)
from brixta_cli.doctor import collect_checks, print_checks
from brixta_cli.tunnel import start_cloudflare_tunnel, stop_process
from brixta_cli.verify import (
    PublicGatewayTimeout,
    verify_local_gateway,
    verify_oauth_discovery,
    wait_for_public_gateway,
)


def _choose_tenant(requested: str | None) -> str:
    if requested:
        return requested

    from runtime.knowledge import list_knowledge_bases

    tenants = sorted(
        {item["tenant_id"] for item in list_knowledge_bases(limit=500)}
    )
    if not tenants:
        raise RuntimeError("No ready knowledge bases exist yet.")
    if len(tenants) == 1:
        return tenants[0]
    if not sys.stdin.isatty():
        raise RuntimeError("Multiple tenants exist. Pass --tenant TENANT_ID.")

    print("\nChoose the tenant the client may access:")
    for index, tenant in enumerate(tenants, start=1):
        print(f"  {index}. {tenant}")
    while True:
        value = input("Tenant number: ").strip()
        if value.isdigit() and 1 <= int(value) <= len(tenants):
            return tenants[int(value) - 1]


def _wait_for_port(host: str, port: int, timeout: float = 30) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        with socket.socket() as sock:
            sock.settimeout(0.5)
            if sock.connect_ex((host, port)) == 0:
                return
        time.sleep(0.25)
    raise RuntimeError(
        f"MCP gateway did not open {host}:{port} within {timeout:.0f}s."
    )


def _print_failed_checks() -> bool:
    checks = collect_checks(semantic=True)
    if all(check.ok for check in checks):
        return False
    print("BRIXTA doctor\n")
    print_checks(checks)
    print("\nFix the failed checks before starting the MCP gateway.")
    return True


def _processes_alive(state: dict[str, Any]) -> bool:
    return process_alive(state.get("mcp_pid")) and process_alive(
        state.get("tunnel_pid")
    )


def _start_mcp(environment: dict[str, str]) -> subprocess.Popen[bytes]:
    mcp_log = STATE_DIR / "mcp.log"
    with mcp_log.open("ab", buffering=0) as output:
        process: subprocess.Popen[bytes] = subprocess.Popen(
            [sys.executable, "-m", "api.mcp_server"],
            env=environment,
            stdout=output,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    return process


def _knowledge_count(checks: list[Any]) -> str:
    knowledge_check = next(
        check for check in checks if check.label == "Knowledge bases"
    )
    return knowledge_check.detail.split(" ", 1)[0]


def _print_public_success(
    *,
    checks: list[Any],
    public_url: str,
    tools: set[str],
    open_browser: bool,
) -> None:
    print("\n✓ BRIXTA configuration valid")
    print("✓ PostgreSQL connected")
    print(f"✓ {_knowledge_count(checks)} knowledge bases ready")
    print("✓ Semantic retrieval operational")
    print("✓ MCP gateway running")
    print("✓ Secure HTTPS endpoint available")
    print("✓ OAuth authentication enabled")
    print(f"✓ {len(tools)} MCP tools verified")
    print(f"\nChatGPT MCP URL:\n{public_url}")
    print("\nComplete the one-time connection approval in ChatGPT.")
    if open_browser:
        webbrowser.open(
            os.getenv(
                "BRIXTA_CHATGPT_CONNECT_URL",
                "https://chatgpt.com/plugins",
            )
        )


def _verify_managed_public_gateway(
    *,
    state: dict[str, Any],
    checks: list[Any],
    open_browser: bool,
) -> int:
    public_url = str(state["mcp_url"])
    timeout = float(os.getenv("BRIXTA_PUBLIC_VERIFY_TIMEOUT", "180"))

    def record_retry(
        attempt: int,
        error: BaseException,
        delay: float,
    ) -> None:
        update_state(
            status="starting",
            verification_attempt=attempt,
            last_error=str(error),
        )
        if attempt in {1, 3, 6, 10}:
            print(
                f"Waiting for the public hostname "
                f"(attempt {attempt}, retrying in {delay:.1f}s)…"
            )

    try:
        tools = wait_for_public_gateway(
            public_url,
            timeout=timeout,
            gateway_alive=lambda: _processes_alive(load_state()),
            on_retry=record_retry,
        )
    except PublicGatewayTimeout as exc:
        # DNS and edge propagation are not reasons to kill two healthy local
        # processes.  Preserve them and let the same command resume later.
        if _processes_alive(load_state()):
            update_state(status="degraded", last_error=str(exc))
            print("\n⚠ BRIXTA's local MCP gateway is still running.")
            print("⚠ The new Cloudflare hostname is not publicly ready yet.")
            print("⚠ BRIXTA did not terminate either process.")
            print(f"\nPending MCP URL:\n{public_url}")
            print(
                "\nRun the same `brixta connect chatgpt --local --tenant ...` "
                "command again to recheck this existing connection."
            )
            return 2
        update_state(status="failed", last_error=str(exc))
        raise RuntimeError(
            "The MCP or cloudflared process exited while public readiness "
            "was being checked."
        ) from exc
    except Exception as exc:
        update_state(status="failed", last_error=str(exc))
        raise RuntimeError(
            f"The public MCP endpoint is reachable but failed verification: {exc}"
        ) from exc

    update_state(
        status="online",
        connected_at=utc_now(),
        last_error=None,
        verified_tools=sorted(tools),
    )
    _print_public_success(
        checks=checks,
        public_url=public_url,
        tools=tools,
        open_browser=open_browser,
    )
    return 0


def _reusable_chatgpt_state(tenant: str) -> dict[str, Any] | None:
    state = load_state()
    if not state:
        return None
    managed_alive = process_alive(state.get("mcp_pid")) or process_alive(
        state.get("tunnel_pid")
    )
    if not managed_alive:
        return None
    if state.get("mode") != "local-chatgpt":
        raise RuntimeError(
            "Another BRIXTA local connection is already running. "
            "Run `brixta disconnect` before starting ChatGPT mode."
        )
    if state.get("tenant_id") != tenant:
        raise RuntimeError(
            "The running BRIXTA gateway is scoped to tenant "
            f"{state.get('tenant_id')!r}. Run `brixta disconnect` before "
            f"switching to {tenant!r}."
        )
    if not _processes_alive(state):
        raise RuntimeError(
            "Only part of the previous BRIXTA connection is alive. "
            "Run `brixta disconnect` once, then connect again."
        )
    if not str(state.get("mcp_url", "")).startswith("https://"):
        raise RuntimeError(
            "The running connection has no valid public MCP URL. "
            "Run `brixta disconnect` once, then connect again."
        )
    return state


def connect_local(*, tenant_id: str | None, open_browser: bool = True) -> int:
    """Start or resume a public development gateway for ChatGPT."""
    checks = collect_checks(semantic=True)
    if not all(check.ok for check in checks):
        print("BRIXTA doctor\n")
        print_checks(checks)
        print("\nFix the failed checks before exposing BRIXTA.")
        return 1

    tenant = _choose_tenant(tenant_id)
    STATE_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)

    reusable = _reusable_chatgpt_state(tenant)
    if reusable is not None:
        print(
            "Reusing the existing BRIXTA MCP and Cloudflare processes; "
            "checking public readiness again."
        )
        update_state(status="starting", last_error=None)
        return _verify_managed_public_gateway(
            state=reusable,
            checks=checks,
            open_browser=open_browser,
        )

    tunnel_log = STATE_DIR / "tunnel.log"
    tunnel_process: subprocess.Popen[bytes] | None = None
    mcp_process: subprocess.Popen[bytes] | None = None
    public_url = ""

    try:
        tunnel_process, public_url = start_cloudflare_tunnel(
            "http://127.0.0.1:8001",
            tunnel_log,
        )
        public_host = urlparse(public_url).hostname or ""
        environment = {
            **os.environ,
            "BRIXTA_MCP_AUTH_MODE": "oauth-local",
            "BRIXTA_MCP_TENANT_ID": tenant,
            "BRIXTA_MCP_PUBLIC_URL": public_url,
            "BRIXTA_MCP_HOST": "127.0.0.1",
            "BRIXTA_MCP_PORT": "8001",
            "BRIXTA_MCP_TRANSPORT": "http",
            "FASTMCP_CHECK_FOR_UPDATES": "off",
            "MCP_ALLOWED_HOSTS": public_host,
            "MCP_ALLOWED_ORIGINS": f"https://{public_host}",
        }
        mcp_process = _start_mcp(environment)

        # Persist PIDs immediately.  Even Ctrl-C or a public DNS delay can now
        # be recovered with `brixta disconnect` or by rerunning this command.
        save_state(
            {
                "mode": "local-chatgpt",
                "status": "starting",
                "tenant_id": tenant,
                "mcp_url": public_url,
                "auth_mode": "oauth-local",
                "mcp_pid": mcp_process.pid,
                "tunnel_pid": tunnel_process.pid,
                "started_at": utc_now(),
                "last_error": None,
            }
        )
        _wait_for_port("127.0.0.1", 8001)
    except Exception as exc:
        # Startup failures are fatal. Public DNS readiness failures are handled
        # later and deliberately do not enter this cleanup block.
        if mcp_process is not None:
            stop_process(mcp_process)
        if tunnel_process is not None:
            stop_process(tunnel_process)
        save_state(
            {
                "mode": "local-chatgpt",
                "status": "failed",
                "tenant_id": tenant,
                "mcp_url": public_url or None,
                "auth_mode": "oauth-local",
                "mcp_pid": None,
                "tunnel_pid": None,
                "started_at": utc_now(),
                "last_error": str(exc),
            }
        )
        raise RuntimeError(
            f"Could not start the local BRIXTA MCP gateway: {exc}"
        ) from exc

    return _verify_managed_public_gateway(
        state=load_state(),
        checks=checks,
        open_browser=open_browser,
    )


def connect_production(*, open_browser: bool = True) -> int:
    url = os.getenv("BRIXTA_MCP_PUBLIC_URL", "").strip()
    if not url.startswith("https://") or not url.rstrip("/").endswith("/mcp"):
        raise RuntimeError(
            "Set BRIXTA_MCP_PUBLIC_URL to the deployed HTTPS /mcp endpoint."
        )
    verify_oauth_discovery(url)
    print("✓ Production MCP URL configured")
    print("✓ OAuth discovery operational")
    print("✓ Authentication is enforced by the deployed gateway")
    print(f"\nMCP URL:\n{url}")
    print("\nComplete the unavoidable one-time approval in your AI client.")
    if open_browser:
        webbrowser.open(
            os.getenv(
                "BRIXTA_CHATGPT_CONNECT_URL",
                "https://chatgpt.com/plugins",
            )
        )
    return 0


def connect_local_client(*, tenant_id: str | None) -> int:
    """Start a verified loopback gateway for any local MCP-capable client."""
    if _print_failed_checks():
        return 1

    tenant = _choose_tenant(tenant_id)
    existing = load_state()
    if process_alive(existing.get("mcp_pid")):
        raise RuntimeError(
            "A BRIXTA MCP gateway is already running. Run `brixta disconnect` "
            "before starting another local client connection."
        )

    STATE_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    mcp_url = "http://127.0.0.1:8001/mcp"
    environment = {
        **os.environ,
        "BRIXTA_MCP_AUTH_MODE": "none",
        "BRIXTA_MCP_TENANT_ID": tenant,
        "BRIXTA_MCP_PUBLIC_URL": mcp_url,
        "BRIXTA_MCP_HOST": "127.0.0.1",
        "BRIXTA_MCP_PORT": "8001",
        "BRIXTA_MCP_TRANSPORT": "http",
        "FASTMCP_CHECK_FOR_UPDATES": "off",
    }
    process = _start_mcp(environment)
    save_state(
        {
            "mode": "local-client",
            "status": "starting",
            "tenant_id": tenant,
            "mcp_url": mcp_url,
            "auth_mode": "none",
            "mcp_pid": process.pid,
            "started_at": utc_now(),
        }
    )
    try:
        _wait_for_port("127.0.0.1", 8001)
        tools = verify_local_gateway(mcp_url)
    except Exception as exc:
        stop_process(process)
        update_state(
            status="failed",
            mcp_pid=None,
            last_error=str(exc),
        )
        raise

    update_state(
        status="online",
        connected_at=utc_now(),
        last_error=None,
        verified_tools=sorted(tools),
    )
    print("\n✓ BRIXTA configuration valid")
    print("✓ PostgreSQL connected")
    print("✓ Semantic retrieval operational")
    print(f"✓ {len(tools)} MCP tools available")
    print("✓ Loopback-only MCP gateway running")
    print(f"\nMCP URL:\n{mcp_url}")
    print(
        "\nGeneric client configuration:\n"
        '{\n  "mcpServers": {\n    "brixta": {\n'
        f'      "url": "{mcp_url}"\n'
        "    }\n  }\n}"
    )
    print("\nUse `brixta disconnect` when finished.")
    return 0


def connection_status_command() -> int:
    """Print the persisted state alongside live managed-process checks."""
    state = load_state()
    if not state:
        print("BRIXTA connection: disconnected")
        return 1

    mcp_alive = process_alive(state.get("mcp_pid"))
    tunnel_required = state.get("mode") == "local-chatgpt"
    tunnel_alive = process_alive(state.get("tunnel_pid"))
    stored_status = state.get("status", "unknown")
    if not mcp_alive or (tunnel_required and not tunnel_alive):
        effective_status = "offline"
    else:
        effective_status = stored_status

    print(f"BRIXTA connection: {effective_status}")
    print(f"Mode: {state.get('mode', 'unknown')}")
    print(f"Tenant: {state.get('tenant_id', 'unknown')}")
    print(f"MCP process: {'running' if mcp_alive else 'stopped'}")
    if tunnel_required:
        print(f"Tunnel process: {'running' if tunnel_alive else 'stopped'}")
    if state.get("mcp_url"):
        print(f"MCP URL: {state['mcp_url']}")
    if state.get("last_error"):
        print(f"Last readiness error: {state['last_error']}")
    return 0 if effective_status == "online" else 1
