from pathlib import Path
import json

from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.types.doc.document import DoclingDocument

from core.enums import JobStatus
from runtime.utils.job_status import update_job_status


DOCLING_STORAGE = Path("storage/docling")
CHUNK_STORAGE = Path("storage/chunks")

CHUNK_STORAGE.mkdir(
    parents=True,
    exist_ok=True,
)

chunker = HybridChunker()


def chunk_document(job_id: str) -> Path:
    """
    Generates hybrid semantic chunks from a serialized DoclingDocument.
    """

    update_job_status(
        job_id,
        JobStatus.CHUNKING,
    )

    docling_file = DOCLING_STORAGE / f"{job_id}.json"

    if not docling_file.exists():
        update_job_status(
            job_id,
            JobStatus.FAILED,
        )
        raise FileNotFoundError(docling_file)

    try:

        document = DoclingDocument.model_validate_json(
            docling_file.read_text(
                encoding="utf-8",
            )
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

        output = CHUNK_STORAGE / f"{job_id}.json"

        output.write_text(
            json.dumps(
                chunks,
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        update_job_status(
            job_id,
            JobStatus.CHUNKED,
        )

        return output

    except Exception:

        update_job_status(
            job_id,
            JobStatus.FAILED,
        )

        raise