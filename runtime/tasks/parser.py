from runtime.celery_app import celery
from runtime.parser.service import parse_document


@celery.task
def parse_document_task(job_id: str):

    print(f"\n📄 Parsing Job: {job_id}")

    markdown_path = parse_document(job_id)

    print(f"✅ Markdown: {markdown_path}")

    celery.send_task(
        "workers.tasks.chunker.chunk_document_task",
        args=[job_id],
        queue="chunker",
    )

    return str(markdown_path)