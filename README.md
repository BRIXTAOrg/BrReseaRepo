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
storage/markdown/
   │
   ▼
Hybrid Chunking Engine
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
│   │   └── parser.py
│   ├── downloader/
│   │   └── service.py
│   ├── parser/
│   │   └── service.py
│   ├── utils/
│   │   └── job_status.py
│   ├── cleaner/
│   ├── chunker/
│   ├── embeddings/
│   └── storage/
│
├── storage/
│   ├── raw/
│   └── markdown/
│
├── .env
├── requirements.txt
└── README.md
```

## Technology Stack

| Layer             | Technology           |
| ----------------- | -------------------- |
| API               | FastAPI              |
| Validation        | Pydantic             |
| Database          | Neon PostgreSQL      |
| Schema Management | Drizzle ORM          |
| Queue Broker      | Redis                |
| Task Queue        | Celery               |
| Document Parsing  | Docling              |
| HTTP Client       | Requests             |
| Embeddings        | OpenAI / HuggingFace |
| Vector Storage    | pgvector             |
| Container Runtime | Docker + Colima      |

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
* ✅ Markdown Export
* ✅ Local Markdown Storage
* ✅ End-to-End Asynchronous Pipeline

## Roadmap

* [ ] Markdown Cleaner
* [ ] Hybrid Chunking Engine
* [ ] Chunk Storage Layer
* [ ] Embedding Generation
* [ ] Vector Storage (pgvector)
* [ ] Semantic Search
* [ ] Research Retrieval API
* [ ] Connection Pooling (psycopg_pool)
* [ ] Worker Monitoring & Metrics (Prometheus/Grafana)
* [ ] Docker Compose Deployment
* [ ] Kubernetes Deployment (AWS EKS)
* [ ] Terraform Infrastructure
