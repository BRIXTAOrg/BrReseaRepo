"""Cloudflare Quick Tunnel process lifecycle for local development."""

from __future__ import annotations

import os
from pathlib import Path
import re
import shutil
import subprocess
import time


TUNNEL_URL = re.compile(rb"https://[a-z0-9-]+\.trycloudflare\.com")


def stop_process(process: subprocess.Popen[bytes], timeout: float = 5) -> None:
    """Stop a process created by this module without leaving a zombie."""
    if process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=timeout)


def start_cloudflare_tunnel(
    local_url: str,
    log_path: Path,
    *,
    timeout: float | None = None,
) -> tuple[subprocess.Popen[bytes], str]:
    """Start a detached Quick Tunnel and return its process and MCP URL.

    cloudflared writes directly to the durable log file.  The old
    implementation used ``stdout=PIPE`` and a daemon reader thread; that pipe
    disappeared when the short-lived CLI exited and could take cloudflared
    down with it.
    """
    executable = shutil.which("cloudflared")
    if executable is None:
        raise RuntimeError(
            "cloudflared is required for --local. Install it with "
            "`brew install cloudflared` and run the command again."
        )

    log_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    start_offset = log_path.stat().st_size if log_path.exists() else 0
    protocol = os.getenv("BRIXTA_CLOUDFLARE_PROTOCOL", "http2").strip() or "http2"
    start_timeout = timeout or float(
        os.getenv("BRIXTA_CLOUDFLARE_START_TIMEOUT", "45")
    )

    # The child inherits its own file descriptor.  Closing the parent's copy
    # after Popen is safe and leaves cloudflared with a durable output target.
    with log_path.open("ab", buffering=0) as output:
        process: subprocess.Popen[bytes] = subprocess.Popen(
            [
                executable,
                "tunnel",
                "--no-autoupdate",
                "--protocol",
                protocol,
                "--loglevel",
                "info",
                "--url",
                local_url,
            ],
            stdout=output,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

    deadline = time.monotonic() + start_timeout
    captured = b""
    with log_path.open("rb") as reader:
        reader.seek(start_offset)
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError(
                    f"cloudflared exited early with status {process.returncode}; "
                    f"inspect {log_path}"
                )

            chunk = reader.read()
            if chunk:
                captured = (captured + chunk)[-131_072:]
                match = TUNNEL_URL.search(captured)
                if match:
                    public_root = match.group(0).decode("ascii")
                    return process, f"{public_root}/mcp"
            time.sleep(0.2)

    stop_process(process)
    raise RuntimeError(
        f"Timed out waiting for the Cloudflare tunnel URL; inspect {log_path}"
    )
