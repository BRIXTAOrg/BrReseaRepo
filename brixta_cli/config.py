"""Durable local CLI connection state.

The state file is shared by the CLI and the dashboard API.  Writes are atomic
so readers never observe half-written JSON while a tunnel is starting.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
import tempfile
from typing import Any


STATE_DIR = Path(os.getenv("BRIXTA_STATE_DIR", ".brixta")).expanduser()
STATE_FILE = STATE_DIR / "connection.json"


def utc_now() -> str:
    """Return a compact UTC timestamp suitable for persisted CLI state."""
    return datetime.now(timezone.utc).isoformat()


def save_state(state: dict[str, Any]) -> None:
    """Atomically persist connection state with owner-only permissions."""
    STATE_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    payload = dict(state)
    payload["updated_at"] = utc_now()

    descriptor, temporary_name = tempfile.mkstemp(
        prefix=".connection-",
        suffix=".tmp",
        dir=STATE_DIR,
    )
    temporary_path = Path(temporary_name)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            json.dump(payload, output, indent=2, sort_keys=True)
            output.write("\n")
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary_path, STATE_FILE)
        STATE_FILE.chmod(0o600)
    finally:
        try:
            temporary_path.unlink()
        except FileNotFoundError:
            pass


def load_state() -> dict[str, Any]:
    """Load state, treating missing or damaged state as disconnected."""
    if not STATE_FILE.exists():
        return {}
    try:
        value = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def update_state(**changes: Any) -> dict[str, Any]:
    """Merge changes into the current state and return the saved value."""
    state = load_state()
    state.update(changes)
    save_state(state)
    return state


def clear_state() -> None:
    """Remove local connection state after managed processes are stopped."""
    try:
        STATE_FILE.unlink()
    except FileNotFoundError:
        pass


def process_alive(value: object) -> bool:
    """Return whether a positive PID still identifies a running process."""
    if isinstance(value, bool):
        return False
    if isinstance(value, int):
        process_id = value
    elif isinstance(value, str):
        try:
            process_id = int(value)
        except ValueError:
            return False
    else:
        return False
    if process_id <= 0:
        return False
    try:
        os.kill(process_id, 0)
        return True
    except (OSError, OverflowError):
        return False
