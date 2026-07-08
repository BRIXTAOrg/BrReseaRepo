import os

from dotenv import load_dotenv

load_dotenv()


DATABASE_URL = os.environ["DATABASE_URL"]

REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)

# ---------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------

EMBEDDING_PLUGIN = os.getenv(
    "EMBEDDING_PLUGIN",
    "sentence_transformers",
)

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "nomic-ai/nomic-embed-text-v1.5",
)

OPENAI_API_KEY = os.getenv(
    "OPENAI_API_KEY",
    "",
)

# ---------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------

LOG_LEVEL = os.getenv(
    "LOG_LEVEL",
    "INFO",
)

#----------------------------------------------------------------------
#Artifact
#----------------------------------------------------------------------

ARTIFACT_BACKEND = os.getenv(
    "ARTIFACT_BACKEND",
    "local",
)