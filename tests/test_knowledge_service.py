import sys
import types
import unittest
from datetime import datetime, timezone
from unittest.mock import patch


fake_config = types.ModuleType("core.config")
fake_config.BRIXTA_API_PUBLIC_URL = "http://localhost:8000"
fake_config.BRIXTA_DASHBOARD_PUBLIC_URL = "http://localhost:3000"
fake_config.BRIXTA_MCP_PUBLIC_URL = "http://localhost:8001/mcp"
fake_config.BRIXTA_MCP_AUTH_MODE = "none"
fake_database = types.ModuleType("core.database")
fake_database.get_connection = None
fake_plugins = types.ModuleType("core.plugin_loader")
fake_plugins.registry = None

with patch.dict(
    sys.modules,
    {
        "core.config": fake_config,
        "core.database": fake_database,
        "core.plugin_loader": fake_plugins,
    },
):
    from runtime.knowledge.service import _row_to_manifest


class KnowledgeServiceTests(unittest.TestCase):
    def test_completed_job_becomes_a_ready_knowledge_manifest(self):
        completed_at = datetime.now(timezone.utc)
        manifest = _row_to_manifest(
            (
                "4a12fa08-4663-4e92-a8f7-c72d0cc747ad",
                "url",
                "https://example.com/manual",
                "acme",
                "completed",
                9,
                "nomic-ai/nomic-embed-text-v1.5",
                768,
                "Operations manual",
                completed_at,
            )
        )
        self.assertTrue(manifest["ready"])
        self.assertEqual(manifest["chunk_count"], 9)
        self.assertEqual(
            manifest["uri"],
            "brixta://knowledge/4a12fa08-4663-4e92-a8f7-c72d0cc747ad",
        )
        self.assertEqual(
            manifest["mcp_url"],
            "http://localhost:8001/mcp",
        )
        self.assertEqual(
            manifest["mcp_scope"],
            {
                "knowledge_base_id": "4a12fa08-4663-4e92-a8f7-c72d0cc747ad",
                "tenant_id": "acme",
            },
        )
        self.assertFalse(manifest["chatgpt_ready"])
        self.assertNotIn("mcp_command", manifest)

if __name__ == "__main__":
    unittest.main()
