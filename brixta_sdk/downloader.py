from abc import ABC, abstractmethod

from .context import PipelineContext


class DownloaderPlugin(ABC):

    @abstractmethod
    def download(
        self,
        context: PipelineContext,
    ) -> PipelineContext:
        """
        Download a document.
        """
        ...