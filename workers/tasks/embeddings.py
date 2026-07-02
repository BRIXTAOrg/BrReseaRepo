from workers.celery_app import celery
from workers.embeddings.service import generate_embeddings


@celery.task
def generate_embeddings_task(job_id: str):

    print(f"\n🧠 Embedding Job: {job_id}")

    embedding_file = generate_embeddings(job_id)

    print(f"✅ Embeddings: {embedding_file}")

    celery.send_task(
        "workers.tasks.storage.persist_embeddings_task",
        args=[job_id],
        queue="storage",
    )

    return str(embedding_file)