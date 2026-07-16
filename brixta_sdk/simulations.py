"""Backward-compatible imports for the singular simulation SDK module.

New integrations should import from :mod:`brixta_sdk.simulation`.  This module
remains so older dashboard/API code and third-party packs do not break.
"""

from brixta_sdk.simulation import (  # noqa: F401
    CompiledCase,
    OpenFoamChannelParameters,
    RunnerResult,
    SimulationPreflightRequest,
    SimulationRunRequest,
    SimulationStatus,
    StructuralCouponParameters,
)

__all__ = [
    "CompiledCase",
    "OpenFoamChannelParameters",
    "RunnerResult",
    "SimulationPreflightRequest",
    "SimulationRunRequest",
    "SimulationStatus",
    "StructuralCouponParameters",
]
