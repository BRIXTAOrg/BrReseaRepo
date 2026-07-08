from core.config import (
    ARTIFACT_BACKEND,
    EMBEDDING_PLUGIN,
    EMBEDDING_MODEL,
    LOG_LEVEL,
)

from runtime.artifacts.repository import ArtifactRepository

from api.prod_api.models import RuntimeSettings


def runtime() -> RuntimeSettings:
    """
    Returns the active runtime configuration.
    """

    return RuntimeSettings(
        artifact_backend=ARTIFACT_BACKEND,
        embedding_plugin=EMBEDDING_PLUGIN,
        embedding_model=EMBEDDING_MODEL,
        log_level=LOG_LEVEL,
    )


def infrastructure() -> dict:
    """
    Returns infrastructure status.

    Never exposes credentials or connection strings.
    """

    return {
        "database": {
            "provider": "postgresql",
            "connected": True,  # TODO: real health check
        },
        "redis": {
            "provider": "redis",
            "connected": True,  # TODO: real ping
        },
        "storage": {
            "provider": ArtifactRepository.provider(),
            "connected": ArtifactRepository.health(),
        },
    }


def environment() -> dict:
    """
    Returns non-sensitive runtime environment information.
    """

    return {
        "artifact_backend": ARTIFACT_BACKEND,
        "embedding_plugin": EMBEDDING_PLUGIN,
        "embedding_model": EMBEDDING_MODEL,
        "log_level": LOG_LEVEL,
    }


def configuration() -> dict:
    """
    Returns the complete runtime configuration.
    """

    return {
        "runtime": runtime().model_dump(),
        "infrastructure": infrastructure(),
        "environment": environment(),
    }