from runtime.celery_app import celery
from runtime.downloader.service import download_document


@celery.task
def test_ingestion(job_id: str):

    print(f"\n🚀 Processing Job: {job_id}")

    file_path = download_document(job_id)

    print(f"✅ Downloaded: {file_path}")

    celery.send_task(
        "workers.tasks.parser.parse_document_task",
        args=[job_id],
        queue="parser",
    )

    return str(file_path)