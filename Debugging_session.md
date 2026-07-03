# BRIXTA Debugging Session
## Date
2026-07-03

---

# Objective

Deploy the complete BRIXTA AI Research Pipeline onto the Kubernetes (K3s) production cluster and verify end-to-end asynchronous document ingestion.

---

# Initial Symptom

The FastAPI Gateway successfully accepted ingestion requests.

```
POST /ingest
202 Accepted
```

The database correctly stored:

```
status = queued
```

However, nothing happened afterwards.

The Celery workers remained idle and the ingestion_jobs table never progressed beyond:

```
queued
```

---

# Architecture

```
Gateway
    │
    ▼
Redis
    │
    ▼
Downloader
    │
    ▼
Parser
    │
    ▼
Chunker
    │
    ▼
Embeddings
    │
    ▼
Storage
```

---

# Initial Assumptions

We suspected:

- Redis connectivity
- Kubernetes networking
- Celery worker deployment
- Redis Service discovery
- Image version mismatch
- Incorrect broker URL
- Worker queue configuration

---

# Verification Steps

## 1. Redis Connectivity

Verified inside Gateway Pod:

```bash
kubectl exec -it deployment/gateway -- env | grep CELERY
```

Output:

```
CELERY_BROKER_URL=redis://redis-service:6379/0
```

Verified Redis Service:

```
redis-service:6379
```

Result:

✅ Correct

---

## 2. Worker Registration

Verified:

```bash
celery inspect registered
```

Output:

```
workers.tasks.ingestion.test_ingestion
workers.tasks.parser.parse_document_task
workers.tasks.chunker.chunk_document_task
workers.tasks.embeddings.generate_embeddings_task
workers.tasks.storage.persist_embeddings_task
```

Result:

✅ Every task registered.

---

## 3. Active Queues

Verified:

```bash
celery inspect active_queues
```

Output:

```
downloader
parser
chunker
embeddings
storage
```

Result:

✅ Workers listening correctly.

---

## 4. Redis Queue Inspection

```
LLEN downloader
LLEN parser
LLEN chunker
LLEN embeddings
LLEN storage
LLEN celery
```

Unexpected result:

```
downloader = 0
parser = 0
chunker = 0
embeddings = 0
storage = 0

celery = 4
```

This immediately showed every task was being published into the default queue.

---

# Attempt 1

Added routing inside Gateway.

```
celery.send_task(
    "...",
    queue="downloader"
)
```

Expected:

```
Redis
↓

downloader
```

Observed:

```
Redis
↓

celery
```

No improvement.

---

# Attempt 2

Added task_routes

```python
task_routes = {
    ...
}
```

Still no improvement.

Redis still showed:

```
celery
```

instead of

```
downloader
```

---

# Root Cause Investigation

After comparing development and production behaviour, we inspected the Celery configuration.

The configuration contained:

```python
task_routes = {
    ...
}
```

but did NOT explicitly define queues.

Celery therefore continued using its implicit default queue.

Although routes existed, the queues themselves were never declared.

---

# Root Cause

Missing:

```python
from kombu import Queue

task_queues = (
    Queue("downloader"),
    Queue("parser"),
    Queue("chunker"),
    Queue("embeddings"),
    Queue("storage"),
)
```

along with

```python
task_default_queue = "downloader"
```

---

# Final Fix

Updated:

```
workers/celery_app.py
```

to:

```python
from kombu import Queue

task_queues=(
    Queue("downloader"),
    Queue("parser"),
    Queue("chunker"),
    Queue("embeddings"),
    Queue("storage"),
)

task_default_queue="downloader"

task_routes={
    ...
}
```

---

# Result

Immediately after redeployment:

```
Task received
```

appeared.

Entire pipeline executed.

Observed:

```
🚀 Processing Job

↓

📄 Parsing

↓

🧩 Chunking

↓

🧠 Embedding

↓

💾 Persisting
```

Exactly as designed.

---

# Production Verification

Workers now successfully receive tasks.

Example:

```
Task workers.tasks.ingestion.test_ingestion[...] received
```

The previous "queued forever" behaviour disappeared.

---

# Secondary Issue

The downloader later failed with:

```
HTTPError

502 Bad Gateway
```

Cause:

```
Target Website

↓

Returned HTTP 502
```

This is NOT a BRIXTA issue.

The downloader is functioning correctly.

---

# Other Production Issues Solved

## Docker Image Version

Kubernetes failed with:

```
ImagePullBackOff
```

Cause:

```
docker-image.yaml

still referenced

v1
```

while deployments referenced

```
v2
```

Fix:

Updated every image tag before redeployment.

---

## Kubernetes Rollout

Correct deployment sequence:

```
docker build

↓

docker push

↓

kubectl rollout restart deployment gateway

↓

kubectl rollout restart deployment workers-light

↓

kubectl rollout restart deployment worker-embeddings
```

---

# Lessons Learned

## Celery

Task routing alone is insufficient.

Named queues should be explicitly declared using:

```
kombu.Queue
```

for deterministic routing.

---

## Kubernetes

If image tags change, **every** manifest referencing that image must be updated.

One forgotten manifest can silently deploy stale containers.

---

## Redis

Queue lengths are the fastest way to diagnose pipeline failures.

Useful commands:

```
LLEN downloader
LLEN parser
LLEN chunker
LLEN embeddings
LLEN storage
LLEN celery
```

---

## Production Debugging Checklist

Gateway

```
kubectl logs deployment/gateway -f
```

Workers

```
kubectl logs deployment/workers-light -f
```

Embeddings

```
kubectl logs deployment/worker-embeddings -f
```

Redis

```
kubectl exec -it deployment/redis -- redis-cli
```

---

# Current Pipeline Status

```
Gateway
    ✅

Redis
    ✅

Celery Routing
    ✅

Downloader
    ✅

Parser
    ✅

Chunker
    ✅

Embeddings
    ✅

Storage
    ✅

pgvector Persistence
    ✅

End-to-End Pipeline
    ✅ Operational
```

---

# Future Improvements

- Introduce Horizontal Pod Autoscaler (HPA)
- Configure Metrics Server
- Add Prometheus metrics
- Add Grafana dashboards
- Separate exchanges for each queue
- Add retry policies with exponential backoff
- Add Flower for Celery monitoring
- Add distributed tracing (OpenTelemetry)
- Add dead-letter queues (DLQ)
- Add queue depth monitoring