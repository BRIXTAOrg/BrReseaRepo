from brixta_sdk.context import PipelineContext
from brixta_sdk.storage import StoragePlugin

from runtime.storage.service import persist_embeddings


class PgVectorStoragePlugin(StoragePlugin):

    def persist(
        self,
        context: PipelineContext,
    ) -> PipelineContext:

        persist_embeddings(context.job_id)

        return context