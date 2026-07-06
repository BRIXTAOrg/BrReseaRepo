from brixta_sdk.context import PipelineContext
from brixta_sdk.chunker import ChunkerPlugin

from runtime.chunker.service import chunk_document


class HybridChunkerPlugin(ChunkerPlugin):

    def chunk(
        self,
        context: PipelineContext,
    ) -> PipelineContext:

        context.chunks_path = chunk_document(context.job_id)

        return context