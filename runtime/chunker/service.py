from pathlib import Path
import json

from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.types.doc.document import DoclingDocument

from runtime.artifacts.repository import ArtifactRepository


chunker = HybridChunker()


def chunk_document(job_id: str) -> Path:
    """
    Generates hybrid semantic chunks from a serialized DoclingDocument.
    """

    if not ArtifactRepository.docling_exists(job_id):
        raise FileNotFoundError(
            f"Docling artifact for '{job_id}' not found."
        )

    document = DoclingDocument.model_validate_json(
        ArtifactRepository.load_docling(job_id)
    )

    chunks = []

    for index, chunk in enumerate(
        chunker.chunk(document),
        start=1,
    ):
        chunks.append(
            {
                "chunk_id": index,
                "text": chunker.contextualize(chunk),
            }
        )

    ArtifactRepository.save_chunks(
        job_id,
        json.dumps(
            chunks,
            indent=2,
            ensure_ascii=False,
        ),
    )

    return Path(f"chunks/{job_id}.json")