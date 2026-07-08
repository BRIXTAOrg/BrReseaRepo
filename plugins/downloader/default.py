from pathlib import Path

import requests

from brixta_sdk.context import PipelineContext
from brixta_sdk.downloader import DownloaderPlugin

from runtime.artifacts.repository import ArtifactRepository


class DefaultDownloaderPlugin(DownloaderPlugin):

    name = "HTTP Downloader"
    version = "1.0.0"

    def download(
        self,
        context: PipelineContext,
    ) -> PipelineContext:

        if context.raw_path and context.raw_path.exists():
            return context

        if context.source_type != "url":
            raise ValueError(
                f"Unsupported source type '{context.source_type}'."
            )

        response = requests.get(
            context.source_target,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/137.0.0.0 Safari/537.36"
                )
            },
            timeout=30,
        )

        response.raise_for_status()

        ArtifactRepository.save_raw(
            context.job_id,
            response.text,
        )

        context.raw_path = Path(
            f"raw/{context.job_id}.html"
        )

        return context