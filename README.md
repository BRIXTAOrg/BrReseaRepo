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
Celery + Redis
   │
   ▼
Background Worker
   │
   ▼
Downloader
   │
   ▼
Docling
   │
   ▼
Markdown
   │
   ▼
Chunking Engine
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
│   ├── database.py         # Neon PostgreSQL Connection
│   ├── enums.py            # Pipeline Enums
│   ├── exceptions.py       # Shared Exceptions
│   └── schemas.py          # Pydantic Models
│
├── workers/                # Celery Background Workers
│   ├── __init__.py
│   ├── celery_app.py
│   ├── base.py
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── ingestion.py
│   ├── downloader/
│   ├── parser/
│   ├── cleaner/
│   ├── chunker/
│   ├── embeddings/
│   └── storage/
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
| Parsing           | Docling              |
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
* ✅ Asynchronous Job Dispatch
* ✅ End-to-End Queue Execution

## Roadmap

* [ ] Document Downloader
* [ ] Docling Parser
* [ ] Markdown Cleaner
* [ ] Hybrid Chunking Engine
* [ ] Embedding Generation
* [ ] Vector Storage
* [ ] Semantic Search
* [ ] Research Retrieval API
* [ ] Connection Pooling (psycopg_pool)
* [ ] Worker Monitoring & Metrics
* [ ] Docker Compose Deployment
* [ ] Kubernetes Deployment

```
```
