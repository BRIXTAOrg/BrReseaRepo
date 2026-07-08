from abc import ABC, abstractmethod

from .context import PipelineContext


class DownloaderPlugin(ABC):

    name: str
    version: str
    source_types: list[str]

    @abstractmethod
    def download(
        self,
        context: PipelineContext,
    ) -> PipelineContext:
        """
        Download a document.
        """
        ...