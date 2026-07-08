import json
from pathlib import Path

from sentence_transformers import SentenceTransformer

from brixta_sdk.context import PipelineContext
from brixta_sdk.embedding import EmbeddingPlugin

from runtime.artifacts.repository import ArtifactRepository


class SentenceTransformersEmbeddingPlugin(EmbeddingPlugin):

    name = "Sentence Transformers"
    version = "1.0.0"

    def models(self) -> list[str]:
        """
        Returns all supported Sentence Transformers models.
        """

        return [
            "nomic-ai/nomic-embed-text-v1.5",
            "BAAI/bge-large-en-v1.5",
            "jinaai/jina-embeddings-v3",
            "intfloat/e5-large-v2",
        ]

    def embed(
        self,
        context: PipelineContext,
        model: str,
    ) -> PipelineContext:

        if context.embeddings_path and context.embeddings_path.exists():
            return context

        if not ArtifactRepository.chunks_exists(context.job_id):
            raise FileNotFoundError(
                f"Chunk artifact for '{context.job_id}' not found."
            )

        chunks = json.loads(
            ArtifactRepository.load_chunks(context.job_id)
        )

        embedding_model = SentenceTransformer(model)

        embedded_chunks = []

        for chunk in chunks:

            vector = embedding_model.encode(
                f"search_document: {chunk['text']}",
                normalize_embeddings=True,
            ).tolist()

            embedded_chunks.append(
                {
                    "chunk_id": chunk["chunk_id"],
                    "text": chunk["text"],
                    "embedding": vector,
                }
            )

        ArtifactRepository.save_embeddings(
            context.job_id,
            json.dumps(
                embedded_chunks,
                indent=2,
                ensure_ascii=False,
            ),
        )

        context.embeddings_path = Path(
            f"embeddings/{context.job_id}.json"
        )

        return context