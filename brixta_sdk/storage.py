from abc import ABC, abstractmethod

from .context import PipelineContext


class StoragePlugin(ABC):

    @abstractmethod
    def persist(
        self,
        context: PipelineContext,
    ) -> PipelineContext:
        """
        Persist generated embeddings.
        """
        ...