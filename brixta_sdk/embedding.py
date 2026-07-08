from abc import ABC, abstractmethod

from .context import PipelineContext


class EmbeddingPlugin(ABC):
    name: str
    version: str

    @abstractmethod
    def models(self) -> list[str]:
        """
        Returns all supported embedding models.
        """
        ...


    @abstractmethod
    def embed(
        self,
        context: PipelineContext,
        model: str,
    ) -> PipelineContext:
        """
        Generate embeddings using the selected model.
        """
        ...