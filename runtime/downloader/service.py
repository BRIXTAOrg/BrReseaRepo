from pathlib import Path

import requests

from core.database import get_connection
from core.enums import JobStatus
from runtime.utils.job_status import update_job_status


RAW_STORAGE = Path("storage/raw")
RAW_STORAGE.mkdir(parents=True, exist_ok=True)


def download_document(job_id: str) -> Path:
    """
    Downloads the source document associated with an ingestion job.

    Returns
    -------
    Path
        Local path of the downloaded file.
    """

    # Mark as downloading
    update_job_status(
        job_id,
        JobStatus.DOWNLOADING,
    )

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
        update_job_status(
            job_id,
            JobStatus.FAILED,
        )
        raise RuntimeError(f"Job '{job_id}' not found.")

    source_url = row[0]

    try:
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

        file_path = RAW_STORAGE / f"{job_id}.html"

        file_path.write_text(
            response.text,
            encoding="utf-8",
        )

        # Mark as downloaded
        update_job_status(
            job_id,
            JobStatus.DOWNLOADED,
        )

        return file_path

    except Exception:
        # Mark as failed
        update_job_status(
            job_id,
            JobStatus.FAILED,
        )
        raise