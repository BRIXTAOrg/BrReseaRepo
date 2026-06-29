from shared.database import get_connection
from shared.enums import JobStatus


def update_job_status(
    job_id: str,
    status: JobStatus,
):
    """
    Updates the processing status of an ingestion job.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute(
                """
                UPDATE "BrResearch".ingestion_jobs
                SET status = %s
                WHERE id = %s
                """,
                (
                    status.value,
                    job_id,
                ),
            )