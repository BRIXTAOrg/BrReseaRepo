# BRIXTA Core

BRIXTA Core is a modular, event-driven AI integration platform for ingesting, transforming, embedding, storing, and serving enterprise knowledge.

Built with an **Integration-First** philosophy, BRIXTA does not reinvent mature technologies. Instead, it provides a unified orchestration layer over best-in-class open-source components through a plugin architecture.

---

# Core Principles

- Plugin First
- Integration First
- OSS First
- Event Driven
- Cloud Native
- Kubernetes Native
- Vendor Agnostic

---

# Architecture

```text
                           Client
                              │
                              ▼
                         FastAPI Gateway
                              │
                              ▼
                       PipelineContext
                              │
                              ▼
                       Celery Orchestrator
                              │
                              ▼
                        Plugin Loader
                              │
     ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼
 Downloader      Parser        Chunker      Embedding      Storage
  Plugin          Plugin         Plugin        Plugin        Plugin
     │              │              │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
                              │
                              ▼
                      Artifact Repository
                              │
                              ▼
                      Artifact Backend
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
         Local Filesystem              MinIO / S3
                              │
                              ▼
                  PostgreSQL + pgvector
```

---

# Event Pipeline

# PipelineContext

PipelineContext is the contract shared by every stage of the runtime.

Rather than creating new payloads between workers, each plugin enriches the same context.

```text
URL / File
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
Embedding
      │
      ▼
Storage
```

Every stage executes independently through Celery queues.

---

# Current Plugin System

| Category | Default Plugin |
|----------|----------------|
| Downloader | HTTP Downloader |
| Parser | Docling |
| Chunker | Hybrid Chunker |
| Embedding | Sentence Transformers |
| Storage | pgvector |

Each plugin implements a simple SDK interface and can be replaced without modifying the runtime.

---

# Supported Infrastructure

| Component | Backend |
|-----------|---------|
| API | FastAPI |
| Workers | Celery |
| Broker | Redis |
| Database | PostgreSQL |
| Vector Store | pgvector |
| Object Storage | Local / MinIO |
| Container Platform | Docker |
| Orchestration | Kubernetes |

---

# Project Structure

```text
brixta-core/

├── api/
│   ├── prod_api/
│   └── main.py
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
├── runtime/
│   ├── tasks/
│   ├── artifacts/
│   ├── celery_app.py
│   ├── jobs/
│   └── utils/
│
├── core/
│   ├── plugin_loader.py
│   ├── config.py
│   ├── database.py
│   ├── enums.py
│   └── constants.py
│
├── storage/
├── infra/
├── k8s/
├── docker/
└── README.md
```

---

# Production APIs

BRIXTA exposes production endpoints for runtime monitoring and infrastructure management.

```text
/prod

├── health
├── storage
├── settings
├── plugins
├── docker
├── kubernetes
├── celery
└── redis
```

These APIs power the BRIXTA Dashboard.

---

# Dashboard

A dedicated Next.js dashboard is under active development.

Planned modules include:

- Dashboard
- Ingestion
- Jobs
- Plugins
- Storage
- Monitoring
- Docker
- Kubernetes
- Celery
- Redis
- MinIO
- Marketplace

---

# Integration Philosophy

BRIXTA integrates existing best-in-class open-source technologies instead of rebuilding them.

| Capability | Strategy |
|------------|----------|
| OCR | Integration |
| PDF Parsing | Integration |
| Embeddings | Integration |
| LLMs | Integration |
| Vector Databases | Integration |
| MQTT | Integration |
| OPC UA | Integration |
| SAP | Integration |
| Tally | Integration |
| Object Storage | Integration |
| Authentication | Integration |

---

# Roadmap

- Multi-plugin marketplace
- Runtime plugin installation
- Multi-tenant deployments
- Distributed workers
- Kubernetes operator
- Webhook integrations
- Authentication providers
- Dashboard SSO
- Plugin SDK publishing
- Cloud deployment templates
- Enterprise monitoring
## Core Components

| Component | Responsibility |
|----------|----------------|
| API Gateway | Accepts ingestion requests and exposes production APIs |
| Runtime | Orchestrates asynchronous pipeline execution |
| PipelineContext | Shared immutable context passed across pipeline stages |
| BRIXTA SDK | Stable interfaces for building plugins |
| Plugin Loader | Loads configured plugin implementations |
| Official Plugins | Default OSS implementations for each processing stage |
| Artifact Repository | Stores and retrieves processing artifacts |
| Artifact Backends | Abstract object storage providers |
| Job Repository | Persists job metadata and lifecycle |
| Infrastructure | Redis, PostgreSQL, MinIO, Kubernetes, Docker |

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Dashboard | Next.js 16 + React + TypeScript |
| API | FastAPI |
| Runtime | Celery |
| Message Broker | Redis |
| Database | PostgreSQL |
| Vector Database | pgvector |
| Context Model | PipelineContext |
| Plugin SDK | BRIXTA SDK |
| Downloader | HTTP Downloader |
| Parser | Docling |
| Chunker | Hybrid Chunker |
| Embeddings | Sentence Transformers |
| Default Model | Nomic Embed v1.5 |
| Object Storage | Local Filesystem / MinIO |
| Infrastructure | Docker |
| Orchestration | Kubernetes (K3s) |
| Secrets | Infisical |
| Monitoring | Production API |
| Dashboard | BRIXTA Dashboard (Next.js) |

---

# Current Progress

## Core Platform

- ✅ FastAPI Gateway
- ✅ Production Management APIs
- ✅ Celery Runtime
- ✅ Redis Message Broker
- ✅ PostgreSQL Integration
- ✅ pgvector Storage
- ✅ PipelineContext
- ✅ Job Repository
- ✅ Configuration System

## Plugin SDK

- ✅ Downloader SDK
- ✅ Parser SDK
- ✅ Chunker SDK
- ✅ Embedding SDK
- ✅ Storage SDK
- ✅ Plugin Loader
- ✅ Runtime Plugin Discovery
- ✅ Configuration-driven Plugin Selection

## Official Plugins

- ✅ HTTP Downloader
- ✅ Docling Parser
- ✅ Hybrid Chunker
- ✅ Sentence Transformers Embedding Plugin
- ✅ pgvector Storage Plugin

## Artifact System

- ✅ Artifact Repository
- ✅ Local Filesystem Backend
- ✅ MinIO Backend
- ✅ Configuration-driven Backend Selection

## AI Pipeline

- ✅ URL Download
- ✅ Canonical DoclingDocument
- ✅ Markdown Export
- ✅ Hybrid Semantic Chunking
- ✅ Open Source Embeddings
- ✅ Automatic Vector Persistence
- ✅ End-to-End Processing Pipeline

## Infrastructure

- ✅ Docker Development Environment
- ✅ Kubernetes Manifests
- ✅ Redis
- ✅ MinIO
- ✅ Production Monitoring APIs
- ✅ Runtime Health Endpoints

## Dashboard

- 🚧 Next.js Dashboard
- 🚧 Plugin Management
- 🚧 Job Monitoring
- 🚧 Infrastructure Monitoring
- 🚧 Document Import UI
- 🚧 Production Console

---

# Design Philosophy

BRIXTA follows an **Integration-First** architecture.

Rather than rebuilding mature technologies, BRIXTA integrates best-in-class open-source systems through stable SDK interfaces.

The Runtime orchestrates.

Plugins perform the work.

Infrastructure remains replaceable.

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

### Core Principles

- Integration First
- Plugin First
- OSS First
- Stable SDK Interfaces
- Event Driven Runtime
- Configuration over Code
- Vendor Neutral Infrastructure
- Cloud Native
- Kubernetes Native
- Horizontal Scalability

> **Write the orchestration. Integrate the specialists.**

---

# Runtime Architecture

```text
                  API Gateway
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
 ┌──────────┬──────────┬──────────┬──────────┬──────────┐
 ▼          ▼          ▼          ▼          ▼
Downloader Parser   Chunker  Embedding  Storage
 Plugin    Plugin    Plugin    Plugin    Plugin
                       │
                       ▼
              Artifact Repository
                       │
                       ▼
              Artifact Backend
                 ┌─────────────┐
                 ▼             ▼
             Local FS       MinIO
                       │
                       ▼
               PostgreSQL + pgvector
```

Each worker owns **one responsibility**.

Every worker receives the same `PipelineContext`, enriches it, and forwards it to the next stage.

---

# 2. Mention Celery Queues

Right now someone reading the README won't know workers are specialized.

Add

```text
Queues

gateway

parser

chunker

embeddings

storage
```

# Plugin Architecture

Every processing stage is a plugin.

```text
DownloaderPlugin

ParserPlugin

ChunkerPlugin

EmbeddingPlugin

StoragePlugin
```

Official plugins currently include:

- HTTP Downloader
- Docling Parser
- Hybrid Chunker
- Sentence Transformers
- pgvector Storage

Future plugins may include:

- OPC UA
- MQTT
- SAP
- Tally
- OCR Engines
- Commercial LLMs
- Alternative Vector Databases
- Enterprise Connectors

The Runtime never changes.

Only plugins do.

---

# Artifact Repository

Every pipeline stage produces immutable artifacts.

```text
raw/

docling/

markdown/

chunks/

embeddings/
```

Artifacts make it possible to:

- Resume pipelines
- Inspect intermediate outputs
- Re-embed documents
- Upgrade embedding models
- Debug every stage
- Reprocess without downloading again
- Support distributed object storage

Only the Artifact Backend changes.

The Runtime and Plugins remain untouched.

---

# Configuration-Driven Platform

Everything is selected through configuration.

Examples:

```env
DOWNLOADER_PLUGIN=http
PARSER_PLUGIN=docling
CHUNKER_PLUGIN=hybrid
EMBEDDING_PLUGIN=sentence-transformers
EMBEDDING_MODEL=nomic-ai/nomic-embed-text-v1.5
STORAGE_PLUGIN=pgvector

ARTIFACT_BACKEND=minio

LOG_LEVEL=INFO
```

Changing configuration changes behavior.

The Runtime remains identical.

---

# Production APIs

```text
/prod

├── health
├── settings
├── plugins
│   ├── downloader
│   ├── parser
│   ├── chunker
│   ├── embedding
│   └── storage
├── storage
├── docker
├── kubernetes
├── celery
├── redis
└── environment
```

These APIs power the BRIXTA Dashboard.

---

# Development

## Backend

```bash
uvicorn api.main:app --reload
```

```bash
celery -A runtime.celery_app.celery worker --pool=solo --loglevel=info
```

## Dashboard

```bash
cd brixta-dashboard

npm install

npm run dev
```

---

# Vision

BRIXTA is evolving from an AI ingestion pipeline into a modular AI integration platform.

Document ingestion is only the first workflow.

Future capabilities include:

- Industrial protocols
- Enterprise ERP integrations
- Knowledge synchronization
- AI orchestration
- Vector infrastructure
- Plugin marketplace
- Unified operations dashboard
- Multi-tenant deployments
- Cloud-native runtime
# Development

## Backend

### Start Colima (macOS)

```bash
colima start
```

---

### Start Redis

First time:

```bash
docker run -d \
  --name brixta-redis \
  -p 6379:6379 \
  redis:7
```

Existing container:

```bash
docker start brixta-redis
```

---

### Start MinIO

First time:

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

Existing container:

```bash
docker start brixta-minio
```

---

### Verify Containers

```bash
docker ps
```

---

### MinIO Console

```
http://localhost:9001
```

Credentials

```
Username: minioadmin
Password: minioadmin
```

---

### Start FastAPI

```bash
uvicorn api.main:app --reload
```

---

### Start Celery (Development)

```bash
celery -A runtime.celery_app.celery worker \
    --pool=solo \
    --loglevel=info
```

---

### Start Celery (Linux / Production)

```bash
celery -A runtime.celery_app.celery worker \
    --loglevel=info
```

---

### Purge Celery Queue

```bash
celery -A runtime.celery_app.celery purge
```

---

### Dashboard

```bash
cd brixta-dashboard

npm install

npm run dev
```

---

### Stop Local Services

```bash
docker stop brixta-redis
docker stop brixta-minio
colima stop
```

---

### Cleanup

Containers

```bash
docker system prune -f
```

Everything

```bash
docker system prune -a --volumes -f
```

---

# Kubernetes (K3s)

The production runtime is designed for Kubernetes using K3s.

Secrets are managed through the Infisical Operator.

---

## Start Cluster

```bash
cd ~/brresea

./start.sh
```

---

## Cluster Status

```bash
kubectl get all
```

Pods

```bash
kubectl get pods
```

Deployments

```bash
kubectl get deployments
```

Services

```bash
kubectl get svc
```

---

## Logs

Gateway

```bash
kubectl logs deployment/gateway -f
```

Workers

```bash
kubectl logs deployment/workers-light -f
```

Embedding Workers

```bash
kubectl logs deployment/worker-embeddings -f
```

---

## Restart Deployments

Gateway

```bash
kubectl rollout restart deployment gateway
```

Everything

```bash
kubectl rollout restart deployment --all
```

---

## Stop Cluster

```bash
kubectl delete -f k8s/
```

---

# Roadmap

## Phase 1 — BRIXTA Core

The plugin-driven orchestration engine.

### Runtime

- [x] FastAPI Gateway
- [x] Celery Runtime
- [x] Redis Broker
- [x] PostgreSQL
- [x] pgvector
- [x] PipelineContext
- [x] Job Repository
- [x] Plugin Loader
- [x] BRIXTA SDK
- [x] Production APIs

### Official Plugins

- [x] HTTP Downloader
- [x] Docling Parser
- [x] Hybrid Chunker
- [x] Sentence Transformers
- [x] pgvector Storage

### Artifact System

- [x] Artifact Repository
- [x] Local Filesystem Backend
- [x] MinIO Backend

### Infrastructure

- [x] Docker
- [x] Kubernetes (K3s)
- [x] Infisical
- [x] Production Monitoring APIs

---

## Phase 2 — BRIXTA Dashboard

Operations and management platform.

- [ ] Authentication
- [ ] Dashboard
- [ ] Job Explorer
- [ ] Plugin Manager
- [ ] Storage Explorer
- [ ] Runtime Monitoring
- [ ] Docker Management
- [ ] Kubernetes Management
- [ ] Celery Monitoring
- [ ] Redis Monitoring
- [ ] MinIO Console Integration
- [ ] Document Import
- [ ] Embedding Export

---

## Phase 3 — BRIXTA Integrations

Enterprise integrations built on the SDK.

- [ ] OCR
- [ ] OPC UA
- [ ] MQTT
- [ ] Modbus
- [ ] SAP
- [ ] Tally
- [ ] S3
- [ ] Cloudflare R2
- [ ] Azure Blob
- [ ] Google Cloud Storage
- [ ] OpenAI
- [ ] Ollama
- [ ] vLLM

---

## Phase 4 — BRIXTA Marketplace

Plugin ecosystem.

- [ ] Plugin Registry
- [ ] Plugin Installation
- [ ] Version Management
- [ ] Plugin Verification
- [ ] Community Plugins
- [ ] Commercial Plugins

---

## Phase 5 — BRIXTA Cloud

Managed platform.

- [ ] Multi-Tenant Runtime
- [ ] Distributed Workers
- [ ] Autoscaling
- [ ] GPU Workers
- [ ] Global API
- [ ] Managed Object Storage
- [ ] Hosted Vector Infrastructure
- [ ] Enterprise Management

---

# Long-Term Vision

BRIXTA is evolving into an open, plugin-driven AI integration platform.

Instead of rebuilding mature technologies, BRIXTA orchestrates them through stable SDK interfaces.

Future plugins will span:

- Industrial Automation
- Manufacturing
- Enterprise ERP
- Knowledge Management
- AI Infrastructure
- Vector Databases
- LLM Providers
- Storage Systems
- Business Software
- Research Pipelines

The Runtime remains stable.

The ecosystem grows through plugins.