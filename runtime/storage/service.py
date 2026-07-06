from pathlib import Path
import json

from core.database import get_connection
from core.enums import JobStatus
from runtime.utils.job_status import update_job_status


EMBEDDING_STORAGE = Path("storage/embeddings")


def persist_embeddings(job_id: str) -> None:
    """
    Persists generated embeddings into PostgreSQL (pgvector).
    """

    update_job_status(
        job_id,
        JobStatus.STORING,
    )

    embedding_file = EMBEDDING_STORAGE / f"{job_id}.json"

    if not embedding_file.exists():
        update_job_status(
            job_id,
            JobStatus.FAILED,
        )
        raise FileNotFoundError(embedding_file)

    chunks = json.loads(
        embedding_file.read_text(
            encoding="utf-8",
        )
    )

    try:

        with get_connection() as conn:
            with conn.cursor() as cursor:

                # -----------------------------------------------------------------
                # Fetch tenant from the ingestion job
                # -----------------------------------------------------------------

                cursor.execute(
                    """
                    SELECT tenant_id
                    FROM "BrResearch".ingestion_jobs
                    WHERE id = %s
                    """,
                    (job_id,),
                )

                row = cursor.fetchone()

                if row is None:
                    raise RuntimeError(
                        f"Ingestion job '{job_id}' not found."
                    )

                tenant_id = row[0]

                # -----------------------------------------------------------------
                # Persist every chunk
                # -----------------------------------------------------------------

                for chunk in chunks:

                    cursor.execute(
                        """
                        INSERT INTO "BrResearch".document_chunks
                        (
                            job_id,
                            tenant_id,
                            chunk_index,
                            content,
                            embedding
                        )
                        VALUES
                        (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (
                            job_id,
                            tenant_id,
                            chunk["chunk_id"],
                            chunk["text"],
                            chunk["embedding"],
                        ),
                    )

        update_job_status(
            job_id,
            JobStatus.COMPLETED,
        )

    except Exception:

        update_job_status(
            job_id,
            JobStatus.FAILED,
        )

        raise