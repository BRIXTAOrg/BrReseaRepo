"""Bounded CalculiX runner for deterministic BRIXTA input decks."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path, PurePosixPath
from tempfile import TemporaryDirectory

from brixta_sdk.simulation import CompiledCase, RunnerResult
from core.config import CALCULIX_EXECUTABLE, SIMULATION_TIMEOUT_SECONDS


def _safe_filename(filename: str) -> PurePosixPath:
    path = PurePosixPath(filename)
    if path.is_absolute() or ".." in path.parts or len(path.parts) != 1:
        raise ValueError("CalculiX cases may only contain safe top-level files.")
    return path


class CalculixRunner:
    """Run one precompiled input deck without invoking a shell."""

    def run(self, compiled: CompiledCase) -> RunnerResult:
        if compiled.solver != "calculix" or not compiled.entry_file.endswith(".inp"):
            raise ValueError("Compiled CalculiX case has an invalid solver contract.")
        if compiled.entry_file not in compiled.files:
            raise ValueError("Compiled CalculiX case is missing its entry file.")

        executable = shutil.which(CALCULIX_EXECUTABLE)
        if executable is None:
            raise RuntimeError(
                f"CalculiX executable '{CALCULIX_EXECUTABLE}' was not found. "
                "Use Dockerfile.simulations or choose preview mode."
            )

        with TemporaryDirectory(prefix="brixta-calculix-") as directory:
            workdir = Path(directory)
            for filename, content in compiled.files.items():
                relative = _safe_filename(filename)
                workdir.joinpath(relative.name).write_text(content, encoding="utf-8")

            job_name = Path(compiled.entry_file).stem
            completed = subprocess.run(
                [executable, "-i", job_name],
                cwd=workdir,
                capture_output=True,
                text=True,
                timeout=SIMULATION_TIMEOUT_SECONDS,
                check=False,
            )

            result_files: dict[str, bytes] = {}
            for suffix in (".frd", ".dat", ".sta", ".cvg"):
                path = workdir / f"{job_name}{suffix}"
                if path.is_file() and path.stat().st_size <= 100_000_000:
                    result_files[path.name] = path.read_bytes()

            return RunnerResult(
                return_code=completed.returncode,
                stdout=completed.stdout[-500_000:],
                stderr=completed.stderr[-300_000:],
                files=result_files,
            )
