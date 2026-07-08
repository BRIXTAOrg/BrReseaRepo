from abc import ABC, abstractmethod

from .context import PipelineContext


class ChunkerPlugin(ABC):

    name: str
    version: str

    @abstractmethod
    def chunk(
        self,
        context: PipelineContext,
    ) -> PipelineContext:
        """
        Chunk a parsed document.
        """
        ...