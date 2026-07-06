from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class PipelineContext:
    """
    Shared state passed through the entire BRIXTA pipeline.
    """

    # Job Information
    job_id: str
    tenant_id: str

    # Source
    source_type: str
    source_target: str

    # Artifacts
    raw_path: Path | None = None
    parsed_path: Path | None = None
    chunks_path: Path | None = None
    embeddings_path: Path | None = None

    # Metadata
    metadata: dict[str, Any] = field(default_factory=dict)

    # Runtime Configuration
    config: dict[str, Any] = field(default_factory=dict)