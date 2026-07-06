from abc import ABC, abstractmethod

from .context import PipelineContext


class EmbeddingPlugin(ABC):

    @abstractmethod
    def embed(
        self,
        context: PipelineContext,
    ) -> PipelineContext:
        """
        Generate embeddings.
        """
        ...