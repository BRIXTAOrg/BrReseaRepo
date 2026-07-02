from workers.celery_app import celery
from workers.chunker.service import chunk_document


@celery.task
def chunk_document_task(job_id: str):

    print(f"\n🧩 Chunking Job: {job_id}")

    chunk_file = chunk_document(job_id)

    print(f"✅ Chunks: {chunk_file}")

    celery.send_task(
    "workers.tasks.embeddings.generate_embeddings_task",
    args=[job_id],
    queue="embeddings",
    )

    return str(chunk_file)