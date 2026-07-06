# BRIXTA Core

A modular, event-driven research ingestion pipeline designed for scalable document acquisition, parsing, semantic chunking, embedding generation, and vector storage.

---
## Architecture

```text
                     Client
                        │
                        ▼
                    FastAPI API
                        │
                        ▼
                PipelineContext
                        │
                        ▼
                 Celery Runtime
                        │
                        ▼
                  Plugin Loader
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
 DownloaderPlugin   ParserPlugin   StoragePlugin
        │               │                │
        ▼               ▼                ▼
Official Plugins (Default, Docling, Nomic, pgvector)
                        │
                        ▼
                Artifact Repository
                        │
                        ▼
              PostgreSQL + pgvector
```
---

## Project Structure

```text
brixta-core/

├── api/
│
├── runtime/
│   ├── tasks/
│   ├── downloader/
│   ├── parser/
│   ├── chunker/
│   ├── embeddings/
│   └── storage/
│
├── brixta_sdk/
│   ├── context.py
│   ├── downloader.py
│   ├── parser.py
│   ├── chunker.py
│   ├── embedding.py
│   └── storage.py
│
├── plugins/
│   ├── downloader/
│   ├── parser/
│   ├── chunker/
│   ├── embedding/
│   └── storage/
│
├── core/
│   ├── plugin_loader.py
│   ├── config.py
|   ├── constants.py
|   ├── enums.py
|   ├── exceptions.py
│   └── database.py
│
├── storage/
├── infra/
├── k8s/
└── README.md
```

---

## Core Components
- API
- Runtime
- SDK
- Plugin Loader
- Official Plugins
- Artifact Repository
- Infrastructure

## Technology Stack

| Layer | Technology |
|--------|------------|
| API | FastAPI |
| Runtime | Celery |
| Message Broker | Redis |
| Context Model | PipelineContext |
| Plugin System | BRIXTA SDK |
| Plugin Loader | PluginLoader |
| Parser | Docling |
| Chunker | HybridChunker |
| Embeddings | Nomic Embed v1.5 |
| Vector Store | PostgreSQL + pgvector |
| Job Persistence | PostgreSQL |
| Orchestration | Kubernetes (K3s) |
| Secrets | Infisical |
| Load Testing | k6 |


## Current Progress

- ✅ FastAPI Gateway
- ✅ Neon PostgreSQL
- ✅ Drizzle ORM Schema
- ✅ pgvector Extension
- ✅ Redis Infrastructure
- ✅ Celery Worker Engine
- ✅ Asynchronous Worker Chaining
- ✅ Job Status Tracking
- ✅ HTML/PDF Downloader
- ✅ Docling Parsing
- ✅ Canonical DoclingDocument Serialization
- ✅ Markdown Export
- ✅ Hybrid Semantic Chunking
- ✅ Open-Source Embedding Generation (Nomic Embed v1.5)
- ✅ Automatic Vector Persistence
- ✅ pgvector Storage
- ✅ End-to-End AI Ingestion Pipeline
---

# Design Philosophy

BRIXTA follows an **Integration-First** architecture.

Rather than rebuilding mature technologies, BRIXTA integrates best-in-class open-source systems behind stable interfaces. BRIXTA Core acts as an orchestration engine while specialized components perform the heavy work.

The project is designed around one principle:

> **Write the glue, not the world.**

Every major capability is replaceable through plugins.

```
Acquire
    │
    ▼
Normalize
    │
    ▼
Parse
    │
    ▼
Chunk
    │
    ▼
Embed
    │
    ▼
Store
```

Core Principles

- Integration over reinvention
- Plugin-first architecture
- Stable SDK interfaces
- Runtime owns orchestration
- Configuration over hardcoded implementations
- Event-driven asynchronous execution
- Vendor-neutral infrastructure
- Horizontally scalable workers
- Open-source first

BRIXTA Core orchestrates the pipeline.

Plugins perform the work.

Repositories manage persistence.

Infrastructure remains replaceable.


# Runtime Architecture

```
                API

                 │

                 ▼

         PipelineContext

                 │

                 ▼

              Runtime

                 │

     ┌───────────┼────────────┐

     ▼           ▼            ▼

 JobRepository PluginLoader ArtifactRepository

                 │

                 ▼

Downloader

     ▼

Parser

     ▼

Chunker

     ▼

Embedding

     ▼

Storage
```

The API only accepts requests.

The Runtime owns:

- Job lifecycle
- Worker orchestration
- Plugin execution
- Status transitions
- Retry behaviour

Each worker performs exactly one responsibility and passes a shared `PipelineContext` to the next stage.


# Plugin Architecture

Every processing stage is implemented as a plugin.

```
DownloaderPlugin

ParserPlugin

ChunkerPlugin

EmbeddingPlugin

StoragePlugin
```

BRIXTA Core depends only on SDK interfaces.

Concrete implementations are loaded through the `PluginLoader`.

Current plugins include:

- Default Downloader
- Docling Parser
- Hybrid Chunker
- Nomic Embeddings
- PostgreSQL + pgvector Storage

Future implementations can be added without modifying BRIXTA Core.


# Pipeline Context

Every stage receives the same `PipelineContext`.

```text
Gateway
    │
    ▼
PipelineContext
    │
    ▼
Downloader
    │
    ▼
PipelineContext
    │
    ▼
Parser
    │
    ▼
PipelineContext
    │
    ▼
Chunker
    │
    ▼
PipelineContext
    │
    ▼
Embedding
    │
    ▼
PipelineContext
    │
    ▼
Storage
```

The context contains the complete state of a processing job, including source information, generated artifacts, metadata, runtime configuration, and future plugin-specific data.

---

# Artifact Repository

Every pipeline stage produces a permanent artifact.

```text
storage/

raw/
    Downloaded documents

docling/
    Canonical DoclingDocument

markdown/
    Markdown representation

chunks/
    Semantic chunks

embeddings/
    Generated embedding vectors
```

Artifacts enable:

- Pipeline reproducibility
- Independent debugging
- Pipeline inspection
- Incremental reprocessing
- Model upgrades
- Re-embedding without downloading again
- Offline analysis

The filesystem serves as BRIXTA's **Artifact Repository**, while PostgreSQL stores searchable knowledge.

---

# Configuration-Driven Architecture

Infrastructure and plugins are selected through configuration rather than hardcoded implementations.

Examples:

- Downloader Plugin
- Parser Plugin
- Chunking Plugin
- Embedding Plugin
- Storage Plugin
- Logging
- Message Broker
- Future LLM Providers

Development architecture:

```text
MacBook
    │
    ▼
Docker
    │
    ▼
Redis
    │
    ▼
Celery Runtime
    │
    ▼
Official Plugins
```

Production architecture:

```text
Kubernetes
      │
      ▼
Redis
      │
      ▼
Celery Runtime
      │
      ▼
Plugin Loader
      │
      ▼
Official Plugins
      │
      ▼
PostgreSQL + pgvector
```

Because the runtime depends only on SDK interfaces, BRIXTA can evolve from local development to distributed cloud deployments without changing business logic. New plugins, infrastructure providers, and commercial services can be introduced by configuration rather than code changes.

# Why Artifact Storage?

The `storage/` directory is intentionally preserved.

Instead of discarding intermediate processing stages, BRIXTA stores every generated artifact.

This enables:

- Re-chunking without downloading documents again
- Re-generating embeddings with newer models
- Debugging every pipeline stage independently
- Reproducible research ingestion
- Offline inspection of processed documents

The filesystem stores immutable processing artifacts.

Neon PostgreSQL stores searchable knowledge.

---

## Development Commands

### Start Colima

```bash
colima start
```

### Start Redis Container (First Time)

```bash
docker run -d \
  --name brixta-redis \
  -p 6379:6379 \
  redis:7
```

### Start Existing Redis Container

```bash
docker start brixta-redis
```

### Verify Running Containers

```bash
docker ps
```

### Start FastAPI Gateway

```bash
uvicorn api.main:app --reload
```

### Start Celery Worker (macOS Development)

```bash
celery -A runtime.celery_app.celery worker \
    --pool=solo \
    --loglevel=info
```

### Start Celery Worker (Linux / Production)

```bash
celery -A workers.celery_app.celery worker \
    --loglevel=info
```

### Stop Redis

```bash
docker stop brixta-redis
```

### Stop Colima

```bash
colima stop
```

### Remove Stopped Containers & Cache

```bash
docker system prune -f
```

### Remove Everything (Images + Cache + Volumes)

```bash
docker system prune -a --volumes -f
```

---

## Kubernetes Operations (K3s)

The production environment is orchestrated using a lightweight **K3s Kubernetes** cluster with automated secret injection through the **Infisical Operator**.

---

### Start the Cluster

Starts the K3s environment, applies all Kubernetes manifests from the `k8s/` directory, and synchronizes secrets using the Infisical Operator.

The stuff is inside ~/brresea/

```bash
./start.sh
```

---

### Check Cluster Status

View the status of all running pods, deployments, and services.

```bash
kubectl get pods
```

For a more detailed overview:

```bash
kubectl get all
```

---

### View Application Logs

Stream live logs from the running deployments.

#### FastAPI Gateway

```bash
kubectl logs deployment/gateway -f
```

#### Celery Worker (Light)

```bash
kubectl logs deployment/workers-light -f
```

#### Embedding Worker

```bash
kubectl logs deployment/worker-embeddings -f
```

---

### Restart Deployments

Perform a rolling restart without downtime.

```bash
kubectl rollout restart deployment gateway
kubectl rollout restart deployment workers-light
kubectl rollout restart deployment worker-embeddings
```

Or restart all three in one command:

```bash
kubectl rollout restart deployment \
    gateway \
    workers-light \
    worker-embeddings
```

---

### Stop the Cluster

Delete all deployed Kubernetes resources.

```bash
kubectl delete -f k8s/
```

---

## Roadmap

### Phase 1 — BRIXTA Core

The open-source runtime powering the BRIXTA ecosystem.

#### Architecture

- [x] FastAPI API Runtime
- [x] Celery Runtime
- [x] Redis Message Broker
- [x] Kubernetes (K3s) Deployment
- [x] Plugin SDK
- [x] PipelineContext
- [x] Plugin Loader
- [x] Official Plugin Architecture

#### Official Plugins

- [x] Default Downloader
- [x] Docling Parser
- [x] HybridChunker
- [x] Nomic Embed v1.5
- [x] PostgreSQL + pgvector Storage

#### Runtime Improvements

- [ ] Dynamic Plugin Discovery
- [ ] Plugin Configuration (`plugins.yaml`)
- [ ] Retry Policies
- [ ] Dead Letter Queues
- [ ] Connection Pooling (`psycopg_pool`)
- [ ] Metrics API
- [ ] Prometheus Integration
- [ ] Grafana Dashboards
- [ ] OpenTelemetry Tracing
- [ ] Horizontal Pod Autoscaling
- [ ] KEDA Event Scaling

---

### Phase 2 — BRIXTA Platform

Hosted Vector Embeddings as a Service.

- [ ] Authentication
- [ ] API Keys
- [ ] Credits & Usage Metering
- [ ] Billing
- [ ] User Dashboard
- [ ] Organization & Team Workspaces
- [ ] Multi-Tenant Runtime
- [ ] REST API
- [ ] Python SDK
- [ ] JavaScript SDK
- [ ] CLI

---

### Phase 3 — BRIXTA Marketplace

The OpenRouter for Vector Embeddings.

- [ ] Plugin Registry
- [ ] Plugin Installation
- [ ] Plugin Updates
- [ ] Plugin Versioning
- [ ] Plugin Verification
- [ ] Community Plugins
- [ ] Commercial Plugins
- [ ] Revenue Sharing
- [ ] Plugin Marketplace

---

### Phase 4 — BRIXTA Cloud

Managed Infrastructure.

- [ ] Distributed Worker Clusters
- [ ] GPU Compute Pools
- [ ] Autoscaling
- [ ] Managed Storage
- [ ] Distributed Artifact Repository
- [ ] Global API
- [ ] Multi-Region Deployment
- [ ] Enterprise Management

---

### Phase 5 — BRIXTA Ecosystem

Industry-specific embedding solutions built on BRIXTA Core.

- [ ] Document Intelligence
- [ ] Legal AI
- [ ] Medical Knowledge
- [ ] Financial Research
- [ ] Geospatial Embeddings
- [ ] Multimodal Embeddings
- [ ] Image Search
- [ ] Audio Embeddings
- [ ] Video Embeddings
- [ ] Scientific Knowledge Pipelines

---

## Completed

### Runtime

- [x] FastAPI API
- [x] Celery Runtime
- [x] Redis Broker
- [x] Kubernetes Deployment
- [x] Plugin SDK
- [x] PipelineContext
- [x] Plugin Loader
- [x] JobRepository
- [x] Strongly Typed JobStatus
- [x] Runtime-owned Job Lifecycle
- [x] Automatic Task Retries
- [x] Structured Runtime Logging
- [x] Integration-First Architecture

### Official Plugins

- [x] Default Downloader
- [x] Docling Parser
- [x] HybridChunker
- [x] Nomic Embed v1.5
- [x] PostgreSQL + pgvector Storage

### Pipeline

- [x] End-to-End Asynchronous Processing
- [x] HTML / PDF Download
- [x] Canonical DoclingDocument Generation
- [x] Markdown Export
- [x] Semantic Chunking
- [x] Embedding Generation
- [x] Vector Persistence
- [x] Production Kubernetes Deployment
- [x] Production Load Testing (k6)

### Next

- [ ] Artifact Repository
- [ ] Local Filesystem Backend
- [ ] MinIO Backend
- [ ] Idempotent Artifact Processing
- [ ] Dynamic Plugin Discovery
- [ ] Configuration-driven Plugins
- [ ] Plugin Marketplace