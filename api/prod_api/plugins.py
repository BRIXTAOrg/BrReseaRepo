from brixta_sdk.embedding import EmbeddingPlugin as EmbeddingPluginSDK
from brixta_sdk.downloader import DownloaderPlugin as DownloaderPluginSDK
from plugins.embedding.nomic import SentenceTransformersEmbeddingPlugin
from plugins.downloader.default import DefaultDownloaderPlugin
from brixta_sdk.chunker import ChunkerPlugin as ChunkerPluginSDK
from plugins.chunker.hybrid import HybridChunkerPlugin
from api.prod_api.models import (
    EmbeddingPlugin,
    DownloaderPlugin,
    EmbeddingPluginsResponse,
    DownloaderPluginsResponse,
    ChunkerPlugin,
    ChunkerPluginsResponse,
)


def embedding_plugins() -> EmbeddingPluginsResponse:

    plugins: list[EmbeddingPluginSDK] = [
        SentenceTransformersEmbeddingPlugin(),
    ]

    return EmbeddingPluginsResponse(
        plugins=[
            EmbeddingPlugin(
                name=plugin.name,
                version=plugin.version,
                models=plugin.models(),
            )
            for plugin in plugins
        ]
    )


def downloader_plugins() -> DownloaderPluginsResponse:

    plugins: list[DownloaderPluginSDK] = [
        DefaultDownloaderPlugin(),
    ]

    return DownloaderPluginsResponse(
        plugins=[
            DownloaderPlugin(
                name=plugin.name,
                version=plugin.version,
                source_types=["url"],
            )
            for plugin in plugins
        ]
    )
def chunker_plugins() -> ChunkerPluginsResponse:
    """
    Returns all available chunker plugins.
    """

    plugins: list[ChunkerPluginSDK] = [
        HybridChunkerPlugin(),
    ]

    return ChunkerPluginsResponse(
        plugins=[
            ChunkerPlugin(
                name=plugin.name,
                version=plugin.version,
            )
            for plugin in plugins
        ]
    )