# BRIXTA Core

A modular, event-driven research ingestion pipeline designed for scalable document acquisition, parsing, semantic chunking, embedding generation, artifact management, and vector storage.

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
        ┌───────────────┼──────────────────────────────┐
        ▼               ▼                              ▼
 DownloaderPlugin   ParserPlugin               StoragePlugin
        │               │                              │
        └───────────────┼──────────────────────────────┘
                        ▼
    Official Plugins (Default, Docling, Nomic, pgvector)
                        │
                        ▼
                Artifact Repository
                        │
                        ▼
                 Artifact Backend
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
      Local Filesystem         MinIO (S3)
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
│   ├── storage/
│   └── artifacts/
│       ├── backend.py
│       ├── repository.py
│       ├── local.py
│       └── minio.py
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
│   ├── constants.py
│   ├── enums.py
│   ├── exceptions.py
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
- Artifact Backends
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
| Artifact Repository | ArtifactRepository |
| Artifact Backends | Local Filesystem / MinIO (S3 Compatible) |
| Parser | Docling |
| Chunker | HybridChunker |
| Embeddings | Nomic Embed v1.5 |
| Vector Store | PostgreSQL + pgvector |
| Job Persistence | PostgreSQL |
| Orchestration | Kubernetes (K3s) |
| Secrets | Infisical |
| Load Testing | k6 |

---

## Current Progress

- ✅ FastAPI Gateway
- ✅ Neon PostgreSQL
- ✅ Drizzle ORM Schema
- ✅ pgvector Extension
- ✅ Redis Infrastructure
- ✅ Celery Worker Engine
- ✅ Asynchronous Worker Chaining
- ✅ Job Status Tracking
- ✅ PipelineContext
- ✅ Plugin SDK
- ✅ Plugin Loader
- ✅ Integration-First Architecture
- ✅ Artifact Repository
- ✅ Local Filesystem Backend
- ✅ MinIO Backend
- ✅ Configuration-Driven Artifact Backends
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

Every major capability is replaceable through stable interfaces.

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
- Storage abstraction over storage coupling
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

Current interchangeable infrastructure includes:

- Downloader Plugins
- Parser Plugins
- Chunker Plugins
- Embedding Plugins
- Storage Plugins
- Artifact Backends (Local Filesystem / MinIO)

Future infrastructure can be swapped without changing runtime logic:

- Amazon S3
- Cloudflare R2
- DigitalOcean Spaces
- Backblaze B2
- Google Cloud Storage
- Azure Blob Storage

Only the backend implementation changes.

The Runtime, SDK, Plugins, and Pipeline remain unchanged.

---

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
     ┌────────────┼────────────┐
     ▼            ▼            ▼
JobRepository PluginLoader ArtifactRepository
                                 │
                                 ▼
                         ArtifactBackend
                         ┌──────────────┐
                         ▼              ▼
                  Local Filesystem   MinIO
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
- Artifact orchestration
- Status transitions
- Retry behaviour

Each worker performs exactly one responsibility and passes a shared `PipelineContext` to the next stage.

The Runtime never communicates directly with infrastructure providers.

Instead, it depends on stable abstractions, allowing storage providers, plugins, and infrastructure components to be replaced through configuration rather than code changes.

# Plugin Architecture

Every processing stage is implemented as a plugin.

```text
DownloaderPlugin

ParserPlugin

ChunkerPlugin

EmbeddingPlugin

StoragePlugin
```

BRIXTA Core depends only on SDK interfaces.

Concrete implementations are loaded dynamically through the `PluginLoader`.

Current official plugins include:

- Default Downloader
- Docling Parser
- Hybrid Chunker
- Nomic Embed v1.5
- PostgreSQL + pgvector Storage

Future implementations can be added without modifying BRIXTA Core.

Examples include:

- Alternative Downloaders
- Alternative Parsers
- Alternative Chunkers
- Alternative Embedding Models
- Alternative Vector Databases
- Commercial AI Providers
- Proprietary Enterprise Plugins

The Runtime remains unchanged regardless of which plugins are selected.

---

# Pipeline Context

Every stage receives the same immutable `PipelineContext`.

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

The context represents the complete state of a processing job.

It carries:

- Job Metadata
- Source Information
- Runtime Configuration
- Generated Artifact References
- Processing State
- Future Plugin-specific Metadata

Every worker enriches the same context before handing it to the next stage.

---

# Artifact Repository

Every pipeline stage produces a permanent processing artifact.

```text
Artifact Repository

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

The Runtime never communicates directly with a storage provider.

Instead every stage interacts only with the `ArtifactRepository`.

```text
Downloader
      │
      ▼
ArtifactRepository
      │
      ▼
ArtifactBackend
      │
 ┌────┴─────┐
 ▼          ▼
LocalFS   MinIO
```

Current Artifact Backends

- Local Filesystem
- MinIO (S3 Compatible)

Future Artifact Backends

- Amazon S3
- Cloudflare R2
- DigitalOcean Spaces
- Backblaze B2
- Google Cloud Storage
- Azure Blob Storage

Artifacts enable:

- Pipeline reproducibility
- Independent debugging
- Pipeline inspection
- Incremental reprocessing
- Model upgrades
- Re-embedding without downloading documents again
- Distributed object storage
- Disaster recovery
- Immutable processing history
- Offline analysis

Only the Artifact Backend changes.

The Runtime, Plugins, SDK, and Pipeline remain unchanged.

PostgreSQL stores searchable knowledge.

The Artifact Repository stores immutable processing artifacts.

---

# Configuration-Driven Architecture

Infrastructure is selected through configuration rather than hardcoded implementations.

Examples include:

- Downloader Plugin
- Parser Plugin
- Chunking Plugin
- Embedding Plugin
- Storage Plugin
- Artifact Backend
- Logging
- Message Broker
- Future LLM Providers

Example:

```text
ARTIFACT_BACKEND=local
```

↓

```text
ARTIFACT_BACKEND=minio
```

No Runtime changes.

No Plugin changes.

No Pipeline changes.

Only configuration changes.

Development architecture:

```text
MacBook
    │
    ▼
Docker
    │
    ├──────────────┐
    ▼              ▼
Redis          MinIO
    │              │
    └──────┬───────┘
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
Artifact Repository
      │
      ▼
Artifact Backend
      │
 ┌────┴──────────┐
 ▼               ▼
MinIO       Future S3
      │
      ▼
PostgreSQL + pgvector
```

Because the Runtime depends only on stable SDK interfaces and repository abstractions, BRIXTA can evolve from local development to distributed cloud deployments without changing business logic.

New plugins, infrastructure providers, storage systems, and commercial services can be introduced through configuration rather than code changes.

---

# Why Artifact Storage?

BRIXTA intentionally preserves every intermediate processing artifact.

Rather than discarding the outputs of each stage, the pipeline stores them as immutable artifacts.

This enables:

- Re-downloading only when necessary
- Re-parsing without downloading again
- Re-chunking without parsing again
- Re-generating embeddings using newer models
- Pipeline debugging at every stage
- Offline inspection of processed documents
- Dataset versioning
- Pipeline reproducibility
- Disaster recovery
- Distributed object storage
- Infrastructure portability

The Artifact Repository preserves the complete processing history.

PostgreSQL stores searchable vector knowledge.

Together they separate **processing artifacts** from **retrieval data**, allowing each to evolve independently.

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

### Start MinIO Container (First Time)

```bash
docker run -d \
  --name brixta-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v ~/minio-data:/data \
  quay.io/minio/minio \
  server /data --console-address ":9001"
```

### Start Existing Redis Container

```bash
docker start brixta-redis
```

### Start Existing MinIO Container

```bash
docker start brixta-minio
```

### Open MinIO Console

```text
http://localhost:9001
```

Default Credentials

```text
Username: minioadmin
Password: minioadmin
```
### Start Existing Redis Container

```bash
docker start brixta-redis
```

### Start Existing MinIO Container

```bash
docker start brixta-minio
```

### Verify Running Containers

```bash
docker ps
```

### Open MinIO Console

```text
http://localhost:9001
```

Default Credentials

```text
Username: minioadmin
Password: minioadmin
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
celery -A runtime.celery_app.celery worker \
    --loglevel=info
```

### Purge Pending Celery Tasks (Development)

```bash
celery -A runtime.celery_app.celery purge
```

### Stop Redis

```bash
docker stop brixta-redis
```

### Stop MinIO

```bash
docker stop brixta-minio
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

The project is located inside:

```text
~/brresea/
```

Start the cluster:

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

Restart individual deployments:

```bash
kubectl rollout restart deployment gateway
kubectl rollout restart deployment workers-light
kubectl rollout restart deployment worker-embeddings
```

Or restart everything:

```bash
kubectl rollout restart deployment \
    gateway \
    workers-light \
    worker-embeddings
```

---

### Stop the Cluster

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
- [x] Artifact Repository
- [x] Configuration-Driven Infrastructure

#### Official Plugins

- [x] Default Downloader
- [x] Docling Parser
- [x] HybridChunker
- [x] Nomic Embed v1.5
- [x] PostgreSQL + pgvector Storage

#### Infrastructure

- [x] Local Filesystem Artifact Backend
- [x] MinIO (S3-Compatible) Artifact Backend

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
### Phase 2 — BRIXTA Platform

Hosted Vector Embeddings as a Service.

- [ ] Authentication
- [ ] Single Sign-On (SSO)
- [ ] API Keys
- [ ] Credits & Usage Metering
- [ ] Billing
- [ ] User Dashboard
- [ ] Operations Dashboard
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
- [ ] Managed Object Storage
- [ ] Distributed Artifact Repository
- [ ] Global API
- [ ] Multi-Region Deployment
- [ ] Enterprise Management
- [ ] Managed Observability

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
- [x] Artifact Repository
- [x] Artifact Backend Interface
- [x] Configuration-driven Infrastructure
- [x] Strongly Typed JobStatus
- [x] Runtime-owned Job Lifecycle
- [x] Automatic Task Retries
- [x] Structured Runtime Logging
- [x] Integration-First Architecture

### Infrastructure

- [x] Local Filesystem Artifact Backend
- [x] MinIO Artifact Backend
- [x] S3-Compatible Object Storage
- [x] Immutable Processing Artifacts

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

- [ ] Idempotent Artifact Processing
- [ ] Dynamic Plugin Discovery
- [ ] Plugin Configuration (`plugins.yaml`)
- [ ] Redis Insight Integration
- [ ] Flower Dashboard
- [ ] Prometheus Metrics
- [ ] Grafana Dashboards
- [ ] Authentik / Keycloak SSO
- [ ] Docker Compose
- [ ] Amazon S3 Backend
- [ ] Cloudflare R2 Backend
- [ ] Plugin Marketplace