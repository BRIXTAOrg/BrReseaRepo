from pathlib import Path
import json

from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.types.doc.document import DoclingDocument

from brixta_sdk.context import PipelineContext
from brixta_sdk.chunker import ChunkerPlugin

from runtime.artifacts.repository import ArtifactRepository


class HybridChunkerPlugin(ChunkerPlugin):

    name = "Hybrid Chunker"
    version = "1.0.0"

    _chunker = HybridChunker()

    def chunk(
        self,
        context: PipelineContext,
    ) -> PipelineContext:

        if context.chunks_path and context.chunks_path.exists():
            return context

        if not ArtifactRepository.docling_exists(context.job_id):
            raise FileNotFoundError(
                f"Docling artifact for '{context.job_id}' not found."
            )

        document = DoclingDocument.model_validate_json(
            ArtifactRepository.load_docling(
                context.job_id
            )
        )

        chunks = []

        for index, chunk in enumerate(
            self._chunker.chunk(document),
            start=1,
        ):
            chunks.append(
                {
                    "chunk_id": index,
                    "text": self._chunker.contextualize(chunk),
                }
            )

        ArtifactRepository.save_chunks(
            context.job_id,
            json.dumps(
                chunks,
                indent=2,
                ensure_ascii=False,
            ),
        )

        context.chunks_path = Path(
            f"chunks/{context.job_id}.json"
        )

        return context