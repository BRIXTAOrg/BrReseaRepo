from pathlib import Path

from docling.document_converter import DocumentConverter

from shared.enums import JobStatus
from workers.utils.job_status import update_job_status


RAW_STORAGE = Path("storage/raw")
DOCLING_STORAGE = Path("storage/docling")
MARKDOWN_STORAGE = Path("storage/markdown")

DOCLING_STORAGE.mkdir(
    parents=True,
    exist_ok=True,
)

MARKDOWN_STORAGE.mkdir(
    parents=True,
    exist_ok=True,
)


converter = DocumentConverter()


def parse_document(job_id: str) -> Path:
    """
    Parses a downloaded document into a DoclingDocument and exports
    both the serialized document and Markdown.
    """

    update_job_status(
        job_id,
        JobStatus.PARSING,
    )

    raw_file = None

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

        document = result.document

        # --------------------------------------------------
        # Save canonical DoclingDocument
        # --------------------------------------------------

        docling_path = DOCLING_STORAGE / f"{job_id}.json"

        docling_path.write_text(
            document.model_dump_json(
                indent=2,
            ),
            encoding="utf-8",
        )

        # --------------------------------------------------
        # Export Markdown
        # --------------------------------------------------

        markdown = document.export_to_markdown()

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