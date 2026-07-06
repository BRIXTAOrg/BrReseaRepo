from pathlib import Path

import requests

from core.database import get_connection
from runtime.artifacts.repository import ArtifactRepository


def download_document(job_id: str) -> Path:
    """
    Downloads the source document associated with an ingestion job.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT source_target
                FROM "BrResearch".ingestion_jobs
                WHERE id = %s
                """,
                (job_id,),
            )

            row = cur.fetchone()

    if row is None:
        raise RuntimeError(f"Job '{job_id}' not found.")

    source_url = row[0]

    response = requests.get(
        source_url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/137.0.0.0 Safari/537.36"
            )
        },
        timeout=30,
    )

    response.raise_for_status()

    ArtifactRepository.save_raw(
        job_id,
        response.text,
    )

    return Path(f"raw/{job_id}.html")