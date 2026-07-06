from brixta_sdk.context import PipelineContext
from brixta_sdk.embedding import EmbeddingPlugin

from runtime.embeddings.service import generate_embeddings


class NomicEmbeddingPlugin(EmbeddingPlugin):

    def embed(
        self,
        context: PipelineContext,
    ) -> PipelineContext:

        context.embeddings_path = generate_embeddings(context.job_id)

        return context