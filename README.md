# BRIXTA Research Pipeline

A modular, event-driven research ingestion pipeline designed for scalable document acquisition, parsing, semantic chunking, embedding generation, and vector storage.

## Architecture

```text
Client
   │
   ▼
FastAPI Gateway
   │
   ▼
Neon PostgreSQL (Job Registration)
   │
   ▼
Redis Message Broker
   │
   ▼
Celery Task Queue
   │
   ▼
Ingestion Worker
   │
   ▼
Document Downloader
   │
   ▼
storage/raw/
   │
   ▼
Docling Parser
   │
   ▼
DoclingDocument
   ├──────────────► storage/docling/
   └──────────────► storage/markdown/
                          │
                          ▼
                 Hybrid Chunking Engine
                          │
                          ▼
                   storage/chunks/
                          │
                          ▼
                  Embedding Engine
                          │
                          ▼
            Neon PostgreSQL (pgvector)
```

## Project Structure

```text
BRIXTAresearchPipeline/
├── Resea/                  # Python Virtual Environment
├── infra/                  # Drizzle ORM Schema, Migrations & Infrastructure
│   ├── drizzle/
│   ├── drizzle.config.ts
│   └── schema.ts
│
├── gateway/                # FastAPI REST Gateway
│   └── main.py
│
├── shared/                 # Shared Python Components
│   ├── config.py           # Environment Configuration
│   ├── constants.py        # Shared Constants
│   ├── database.py         # PostgreSQL Connection Layer
│   ├── enums.py            # Pipeline Status Enums
│   ├── exceptions.py       # Shared Exceptions
│   └── schemas.py          # Pydantic Models
│
├── workers/                # Celery Background Workers
│   ├── __init__.py
│   ├── celery_app.py
│   ├── base.py
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── ingestion.py
│   │   ├── parser.py
│   │   └── chunker.py
│   ├── downloader/
│   │   └── service.py
│   ├── parser/
│   │   └── service.py
│   ├── chunker/
│   │   └── service.py
│   ├── embeddings/
│   ├── cleaner/
│   ├── storage/
│   └── utils/
│       └── job_status.py
│
├── storage/
│   ├── raw/
│   ├── docling/
│   ├── markdown/
│   └── chunks/
│
├── .env
├── requirements.txt
└── README.md
```

## Technology Stack

| Layer             | Technology            |
| ----------------- | --------------------- |
| API               | FastAPI               |
| Validation        | Pydantic              |
| Database          | Neon PostgreSQL       |
| Schema Management | Drizzle ORM           |
| Queue Broker      | Redis                 |
| Task Queue        | Celery                |
| Document Parsing  | Docling               |
| Document Chunking | Docling HybridChunker |
| HTTP Client       | Requests              |
| Embeddings        | OpenAI / HuggingFace  |
| Vector Storage    | pgvector              |
| Container Runtime | Docker + Colima       |

## Current Progress

* ✅ FastAPI Gateway
* ✅ Neon PostgreSQL
* ✅ Drizzle ORM Schema
* ✅ pgvector Extension
* ✅ Pydantic Models
* ✅ Shared Configuration Layer
* ✅ Shared Enums & Constants
* ✅ Shared Exception Handling
* ✅ PostgreSQL Integration
* ✅ Redis Infrastructure
* ✅ Celery Worker Engine
* ✅ Celery Task Registration
* ✅ Explicit Task Imports
* ✅ Asynchronous Job Dispatch
* ✅ Multi-Stage Worker Chaining
* ✅ Pipeline Status Tracking
* ✅ Document Downloader
* ✅ Local Raw Document Storage
* ✅ Docling HTML/PDF Parsing
* ✅ Canonical DoclingDocument Serialization
* ✅ Local DoclingDocument Storage
* ✅ Markdown Export
* ✅ Local Markdown Storage
* ✅ Hybrid Semantic Chunking
* ✅ Local Chunk Storage
* ✅ End-to-End Asynchronous Pipeline

## Development Commands

### Start Colima

```bash
colima start
```

### Start Redis Container (first time)

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
uvicorn gateway.main:app --reload
```

### Start Celery Worker

```bash
celery -A workers.celery_app.celery worker --loglevel=info
```

### Stop Redis

```bash
docker stop brixta-redis
```

### Stop Colima

```bash
colima stop
```

### Remove Stopped Docker Resources

```bash
docker system prune -f
```

### Remove Everything Unused (Images + Cache + Volumes)

```bash
docker system prune -a --volumes -f
```

## Roadmap

* [ ] Markdown Cleaner
* [x] Hybrid Chunking Engine
* [ ] Chunk Persistence (PostgreSQL)
* [ ] Embedding Generation
* [ ] Vector Storage (pgvector)
* [ ] Semantic Search
* [ ] Research Retrieval API
* [ ] Connection Pooling (psycopg_pool)
* [ ] Worker Monitoring & Metrics (Prometheus/Grafana)
* [ ] Docker Compose Deployment
* [ ] Kubernetes Deployment (AWS EKS)
* [ ] Terraform Infrastructure
