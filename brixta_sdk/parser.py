from abc import ABC, abstractmethod

from .context import PipelineContext


class ParserPlugin(ABC):

    @abstractmethod
    def parse(
        self,
        context: PipelineContext,
    ) -> PipelineContext:
        """
        Parse a document.
        """
        ...