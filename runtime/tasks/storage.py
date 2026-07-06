from runtime.celery_app import celery
from runtime.storage.service import persist_embeddings


@celery.task
def persist_embeddings_task(job_id: str):

    print(f"\n💾 Persisting Job: {job_id}")

    persist_embeddings(job_id)

    print("✅ Stored in pgvector")