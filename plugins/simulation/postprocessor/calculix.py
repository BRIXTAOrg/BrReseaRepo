"""Conservative CalculiX report generation.

The first Case Card preserves native solver artifacts but intentionally avoids
claiming to parse certification-grade extrema from FRD output.  Its analytical
bar solution remains an explicit reference until a reviewed FRD parser plugin
is installed.
"""

from __future__ import annotations

from typing import Any

from brixta_sdk.simulation import CompiledCase, RunnerResult


class CalculixPostprocessor:
    def process(
        self,
        compiled: CompiledCase,
        runner_result: RunnerResult | None,
        *,
        execution_mode: str,
        evidence: list[dict[str, Any]],
    ) -> tuple[dict[str, Any], str]:
        if runner_result is not None and runner_result.return_code != 0:
            detail = runner_result.stderr or runner_result.stdout
            raise RuntimeError(
                "CalculiX exited with code "
                f"{runner_result.return_code}: {detail[-4_000:]}"
            )
        solver_executed = runner_result is not None
        native_results = sorted(runner_result.files) if runner_result else []
        if solver_executed and not any(
            filename.endswith((".frd", ".dat")) for filename in native_results
        ):
            raise RuntimeError("CalculiX completed without an FRD or DAT result artifact.")

        reference = dict(compiled.analytical_reference)
        summary = {
            **reference,
            "execution_mode": execution_mode,
            "solver": "calculix",
            "solver_executed": solver_executed,
            "solver_return_code": runner_result.return_code if runner_result else None,
            "native_result_files": native_results,
            "evidence_count": len(evidence),
            "claim_level": (
                "native-solver-artifacts-preserved"
                if solver_executed
                else "analytical-preview-only"
            ),
            "limitations": [
                "Linear elastic, small displacement rectangular coupon",
                "Analytical values are reference values, not parsed FRD extrema",
                "Engineering acceptance requires reviewed mesh, loads, and material data",
                "Not a certification, clinical, or final design claim",
            ],
        }
        factor_of_safety = reference.get("factor_of_safety")
        report = "\n".join(
            [
                "# BRIXTA Structural & Material Lab report",
                "",
                f"- Case: `{compiled.case_name}`",
                "- Solver integration: `CalculiX`",
                f"- Execution mode: `{execution_mode}`",
                f"- Solver executed: `{str(solver_executed).lower()}`",
                f"- Reference axial stress: `{reference['axial_stress_mpa']:.6g} MPa`",
                f"- Reference displacement: `{reference['axial_displacement_mm']:.6g} mm`",
                f"- Reference factor of safety: `{factor_of_safety if factor_of_safety is not None else 'not supplied'}`",
                f"- Knowledge evidence items: `{len(evidence)}`",
                "",
                "## Provenance boundary",
                "",
                "BRIXTA validated structured values and deterministically generated the ",
                "CalculiX input deck. Native solver files are preserved when solver mode ",
                "runs. This report does not silently convert an analytical preview into a ",
                "solver-validated or certification claim.",
            ]
        )
        return summary, report
