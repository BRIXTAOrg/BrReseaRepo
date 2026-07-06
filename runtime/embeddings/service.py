from pathlib import Path
import json

from sentence_transformers import SentenceTransformer

from core.enums import JobStatus
from runtime.utils.job_status import update_job_status


CHUNK_STORAGE = Path("storage/chunks")
EMBEDDING_STORAGE = Path("storage/embeddings")

EMBEDDING_STORAGE.mkdir(
    parents=True,
    exist_ok=True,
)


# Loaded once when the Celery worker starts.
model = SentenceTransformer(
    "nomic-ai/nomic-embed-text-v1.5",
)


def generate_embeddings(job_id: str) -> Path:
    """
    Generates embeddings for every document chunk using
    Nomic Embed v1.5.
    """

    update_job_status(
        job_id,
        JobStatus.EMBEDDING,
    )

    chunk_file = CHUNK_STORAGE / f"{job_id}.json"

    if not chunk_file.exists():

        update_job_status(
            job_id,
            JobStatus.FAILED,
        )

        raise FileNotFoundError(chunk_file)

    chunks = json.loads(
        chunk_file.read_text(
            encoding="utf-8",
        )
    )

    embedded_chunks = []

    for chunk in chunks:

        embedding = model.encode(
            f"search_document: {chunk['text']}",
            normalize_embeddings=True,
        ).tolist()

        embedded_chunks.append(
            {
                "chunk_id": chunk["chunk_id"],
                "text": chunk["text"],
                "embedding": embedding,
            }
        )

    output = EMBEDDING_STORAGE / f"{job_id}.json"

    output.write_text(
        json.dumps(
            embedded_chunks,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    update_job_status(
        job_id,
        JobStatus.EMBEDDED,
    )

    return output