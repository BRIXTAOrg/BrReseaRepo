from pathlib import Path
from tempfile import NamedTemporaryFile

from docling.document_converter import DocumentConverter

from runtime.artifacts.repository import ArtifactRepository


converter = DocumentConverter()


def parse_document(job_id: str) -> Path:
    """
    Parses a downloaded document into a DoclingDocument and exports
    both the serialized document and Markdown.
    """

    if not ArtifactRepository.raw_exists(job_id):
        raise FileNotFoundError(
            f"No downloaded document found for job '{job_id}'."
        )

    raw_html = ArtifactRepository.load_raw(job_id)

    with NamedTemporaryFile(
        suffix=".html",
        mode="w",
        encoding="utf-8",
        delete=False,
    ) as tmp:

        tmp.write(raw_html)
        temp_file = tmp.name

    result = converter.convert(temp_file)

    document = result.document

    # --------------------------------------------------
    # Save canonical DoclingDocument
    # --------------------------------------------------

    ArtifactRepository.save_docling(
        job_id,
        document.model_dump_json(
            indent=2,
        ),
    )

    # --------------------------------------------------
    # Export Markdown
    # --------------------------------------------------

    ArtifactRepository.save_markdown(
        job_id,
        document.export_to_markdown(),
    )

    return Path(f"markdown/{job_id}.md")