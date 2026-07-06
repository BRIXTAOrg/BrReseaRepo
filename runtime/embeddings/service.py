from pathlib import Path
import json

from sentence_transformers import SentenceTransformer

from runtime.artifacts.repository import ArtifactRepository


# Loaded once when the Celery worker starts.
model = SentenceTransformer(
    "nomic-ai/nomic-embed-text-v1.5",
)


def generate_embeddings(job_id: str) -> Path:
    """
    Generates embeddings for every document chunk using
    Nomic Embed v1.5.
    """

    if not ArtifactRepository.chunks_exists(job_id):
        raise FileNotFoundError(
            f"Chunk artifact for '{job_id}' not found."
        )

    chunks = json.loads(
        ArtifactRepository.load_chunks(job_id)
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

    ArtifactRepository.save_embeddings(
        job_id,
        json.dumps(
            embedded_chunks,
            indent=2,
            ensure_ascii=False,
        ),
    )

    return Path(f"embeddings/{job_id}.json")