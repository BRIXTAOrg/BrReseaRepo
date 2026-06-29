from pathlib import Path

from docling.document_converter import DocumentConverter

from shared.enums import JobStatus
from workers.utils.job_status import update_job_status


RAW_STORAGE = Path("storage/raw")
MARKDOWN_STORAGE = Path("storage/markdown")

MARKDOWN_STORAGE.mkdir(
    parents=True,
    exist_ok=True,
)


converter = DocumentConverter()


def parse_document(job_id: str) -> Path:
    """
    Parses a downloaded document into Markdown using Docling.

    Parameters
    ----------
    job_id : str
        Ingestion job UUID.

    Returns
    -------
    Path
        Path to the generated Markdown file.
    """

    update_job_status(
        job_id,
        JobStatus.PARSING,
    )

    raw_file = None

    # Look for supported file types
    for extension in (
        ".html",
        ".pdf",
    ):
        candidate = RAW_STORAGE / f"{job_id}{extension}"

        if candidate.exists():
            raw_file = candidate
            break

    if raw_file is None:
        update_job_status(
            job_id,
            JobStatus.FAILED,
        )
        raise FileNotFoundError(
            f"No downloaded document found for job '{job_id}'."
        )

    try:
        result = converter.convert(str(raw_file))

        markdown = result.document.export_to_markdown()

        markdown_path = MARKDOWN_STORAGE / f"{job_id}.md"

        markdown_path.write_text(
            markdown,
            encoding="utf-8",
        )

        update_job_status(
            job_id,
            JobStatus.PARSED,
        )

        return markdown_path

    except Exception:
        update_job_status(
            job_id,
            JobStatus.FAILED,
        )
        raise