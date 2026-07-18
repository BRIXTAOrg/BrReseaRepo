"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Boxes,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  Database,
  FileUp,
  FlaskConical,
  KeyRound,
  Network,
  PlugZap,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  Workflow,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  ["overview", "Architecture"],
  ["self-host", "Self-host"],
  ["api", "API"],
  ["simulations", "Simulation Lab"],
  ["chatgpt", "ChatGPT + MCP"],
  ["clients", "Other clients"],
  ["production", "Production"],
  ["plugins", "Plugins"],
  ["troubleshooting", "Troubleshooting"],
] as const;

const pipeline = [
  { icon: FileUp, label: "Connect", detail: "URL, upload, or scheduled source" },
  { icon: Workflow, label: "Process", detail: "Parse, chunk, and normalize" },
  { icon: Database, label: "Index", detail: "Model-aware pgvector storage" },
  { icon: Search, label: "Retrieve", detail: "Tenant-scoped semantic search" },
  { icon: Bot, label: "Use", detail: "API, MCP, ChatGPT, or local model" },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-zinc-950 text-zinc-100 shadow-sm">
      <button onClick={copy} className="absolute right-3 top-3 rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10" aria-label="Copy command">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="overflow-x-auto p-5 pr-14 text-xs leading-6"><code>{code}</code></pre>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative grid gap-4 border-l pl-8 pb-8 last:pb-0">
      <div className="absolute -left-4 top-0 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{number}</div>
      <div><h3 className="font-semibold">{title}</h3><div className="mt-2 space-y-3 text-sm text-muted-foreground">{children}</div></div>
    </div>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState<(typeof sections)[number][0]>("overview");
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary/10 via-card to-card p-8 md:p-12">
        <motion.div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl" animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }} transition={{ duration: 7, repeat: Infinity }} />
        <div className="relative max-w-3xl">
          <Badge variant="secondary" className="mb-4 gap-2"><BookOpen size={13} /> BRIXTA operator guide</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Connect anything. Process everything. Give AI controlled access.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">A practical guide for local development, self-hosting, API integrations, the shared MCP gateway, production deployment, and plugin development.</p>
        </div>
      </motion.section>

      <div className="sticky top-0 z-20 -mx-2 overflow-x-auto border-b bg-background/90 px-2 py-3 backdrop-blur">
        <div className="flex min-w-max gap-2">{sections.map(([id, label]) => <Button key={id} size="sm" variant={active === id ? "default" : "ghost"} onClick={() => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}>{label}</Button>)}</div>
      </div>

      <section id="overview" className="scroll-mt-20 space-y-5">
        <div><h2 className="text-2xl font-bold">System architecture</h2><p className="text-muted-foreground">Ingestion and retrieval remain separate, reusable layers.</p></div>
        <div className="grid gap-3 lg:grid-cols-5">{pipeline.map((item, index) => { const Icon = item.icon; return <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="relative rounded-2xl border bg-card p-4"><Icon className="text-primary" size={21} /><p className="mt-3 font-semibold">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>{index < pipeline.length - 1 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden text-muted-foreground lg:block" size={18} />}</motion.div>; })}</div>
        <Card><CardContent className="grid gap-4 p-6 md:grid-cols-3"><div className="rounded-2xl bg-muted/50 p-4"><Server className="text-primary" /><p className="mt-3 font-medium">Control plane</p><p className="mt-1 text-sm text-muted-foreground">FastAPI accepts jobs, exposes manifests, settings, and retrieval.</p></div><div className="rounded-2xl bg-muted/50 p-4"><Boxes className="text-primary" /><p className="mt-3 font-medium">Runtime</p><p className="mt-1 text-sm text-muted-foreground">Celery workers execute modular pipeline stages through Redis.</p></div><div className="rounded-2xl bg-muted/50 p-4"><Network className="text-primary" /><p className="mt-3 font-medium">Integration surface</p><p className="mt-1 text-sm text-muted-foreground">The authenticated MCP gateway exposes all authorized knowledge bases.</p></div></CardContent></Card>
      </section>

      <section id="self-host" className="scroll-mt-20 space-y-5">
        <div><h2 className="text-2xl font-bold">Self-host locally</h2><p className="text-muted-foreground">Python 3.11–3.13 is supported. The bootstrap script handles repeatable setup; run each long-lived service in its own terminal.</p></div>
        <Card><CardContent className="p-6">
          <Step number="1" title="Bootstrap the environment"><CodeBlock code={`chmod +x scripts/bootstrap-local.sh\n./scripts/bootstrap-local.sh\nsource Resea/bin/activate`} /><p>The script installs maintained requirements, copies <code>.env.example</code>, starts PostgreSQL/pgvector, Redis and MinIO with Compose, applies migrations, and installs dashboard packages.</p></Step>
          <Step number="2" title="Start infrastructure"><CodeBlock code={`docker compose up -d --wait postgres redis minio\ndocker compose up minio-init`} /><p>Compose starts PostgreSQL with pgvector, Redis, and MinIO using the values in <code>.env.example</code>. Replace every development credential before production.</p></Step>
          <Step number="3" title="Validate BRIXTA"><CodeBlock code={`brixta doctor`} /><p>This checks Python, required dependencies, PostgreSQL, ready knowledge bases, and a real semantic query.</p></Step>
          <Step number="4" title="Start application services"><CodeBlock code={`# Terminal 1\npython -m uvicorn api.main:app --reload\n\n# Terminal 2\npython -m celery -A runtime.celery_app.celery worker --loglevel=info\n\n# Terminal 3\npython -m celery -A runtime.celery_app.celery beat --loglevel=info\n\n# Terminal 4\ncd brixta-dashboard && npm install && npm run dev`} /></Step>
        </CardContent></Card>
      </section>

      <section id="api" className="scroll-mt-20 space-y-5">
        <div><h2 className="text-2xl font-bold">Use the API</h2><p className="text-muted-foreground">The dashboard uses the same endpoints available to your applications.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileUp size={18} /> Ingest a URL</CardTitle></CardHeader><CardContent><CodeBlock code={`curl -X POST http://localhost:8000/ingest \\\n  -H 'Content-Type: application/json' \\\n  -d '{\n    "source_url": "https://example.com/docs",\n    "tenant_id": "acme",\n    "plugins": {}\n  }'`} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Search size={18} /> Search knowledge</CardTitle></CardHeader><CardContent><CodeBlock code={`curl -X POST \\\n  http://localhost:8000/prod/knowledge/JOB_ID/search \\\n  -H 'Content-Type: application/json' \\\n  -d '{"query":"How does deployment work?","limit":5}'`} /></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Core endpoints</CardTitle><CardDescription>Start at the manifest, then retrieve and fetch citations.</CardDescription></CardHeader><CardContent className="grid gap-2 text-sm md:grid-cols-2">{["GET /plugins", "POST /ingest", "POST /ingest/file", "GET /prod/jobs", "GET /prod/knowledge", "GET /prod/knowledge/{id}", "POST /prod/knowledge/{id}/search", "GET /prod/knowledge/{id}/chunks/{index}", "GET /sources", "POST /sources/{id}/sync"].map(endpoint => <div key={endpoint} className="rounded-xl border bg-muted/30 px-3 py-2 font-mono text-xs">{endpoint}</div>)}</CardContent></Card>
      </section>

      <section id="simulations" className="scroll-mt-20 space-y-5">
        <div><h2 className="flex items-center gap-3 text-2xl font-bold"><FlaskConical /> Engineering Simulation Lab</h2><p className="text-muted-foreground">Validated JSON Case Cards compile into complete CalculiX and OpenFOAM projects without runtime C++ generation.</p></div>
        <div className="grid gap-4 md:grid-cols-4">{[["Evidence", "Attach tenant-owned knowledge and retrieve engineering assumptions."], ["Validate", "Reject missing, extra, unsafe or incompatible values."], ["Compile", "Write deterministic solver files and a portable case ZIP."], ["Run", "Queue isolated CalculiX/OpenFOAM workers and preserve native results."]].map(([title, body]) => <Card key={title}><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{body}</CardContent></Card>)}</div>
        <Card><CardHeader><CardTitle>Enable solver execution</CardTitle><CardDescription>Preview/export needs no solver binary. Solver mode uses one isolated queue per engine.</CardDescription></CardHeader><CardContent className="space-y-4"><CodeBlock code={"cd infra && npm run db:migrate\n\n# CalculiX worker (ccx installed)\npython -m celery -A runtime.celery_app.celery worker --loglevel=info -Q simulations.calculix --concurrency=1\n\n# OpenFOAM v13 worker\ndocker build -f Dockerfile.openfoam -t brixta-openfoam:2.2.0 .\ndocker run --rm --env-file .env brixta-openfoam:2.2.0"} /><p className="text-sm text-muted-foreground">Open <code>/simulations</code>, choose a Case Card, adjust bounded inputs, attach optional knowledge, validate, inspect the interactive preview, then save an export or run the solver.</p></CardContent></Card>
        <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Simulation API</CardTitle></CardHeader><CardContent className="space-y-2 text-xs font-mono">{["GET /prod/simulations/case-cards", "POST /prod/simulations/preflight", "POST /prod/simulations/runs", "GET /prod/simulations/runs?tenant_id=...", "GET /prod/simulations/runs/{id}?tenant_id=...", "POST /prod/simulations/runs/{id}/cancel"].map(item => <div key={item} className="rounded-xl bg-muted px-3 py-2">{item}</div>)}</CardContent></Card><Card><CardHeader><CardTitle>Engineering knowledge ingestion</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>The engineering text parser accepts CSV, JSON, YAML, XML, CalculiX <code>.inp/.dat</code>, Fortran, C/C++, Python and shell text.</p><p>These files pass through normal embeddings and can be attached as evidence during simulation preflight.</p></CardContent></Card></div>
      </section>

      <section id="chatgpt" className="scroll-mt-20 space-y-5">
        <div><h2 className="text-2xl font-bold">Connect ChatGPT and MCP clients</h2><p className="text-muted-foreground">One shared gateway discovers every ready knowledge base permitted by the authenticated tenant.</p></div>
        <Card className="overflow-hidden"><CardContent className="p-6 md:p-8"><div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]"><div className="rounded-2xl border p-5 text-center"><Terminal className="mx-auto text-primary" /><p className="mt-3 font-medium">One command</p><code className="mt-2 block text-xs">brixta connect chatgpt --local</code></div><ChevronRight className="mx-auto rotate-90 text-muted-foreground md:rotate-0" /><div className="rounded-2xl border p-5 text-center"><ShieldCheck className="mx-auto text-primary" /><p className="mt-3 font-medium">Secure gateway</p><p className="mt-2 text-xs text-muted-foreground">HTTPS tunnel + tenant-bound OAuth 2.1</p></div><ChevronRight className="mx-auto rotate-90 text-muted-foreground md:rotate-0" /><div className="rounded-2xl border p-5 text-center"><Bot className="mx-auto text-primary" /><p className="mt-3 font-medium">One approval</p><p className="mt-2 text-xs text-muted-foreground">Approve the shared app once in ChatGPT</p></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Dashboard handoff</CardTitle><CardDescription>Open a ready knowledge base and choose “Use with ChatGPT.”</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>BRIXTA enables that knowledge base for its tenant, verifies shared-gateway configuration, copies the MCP URL, and opens ChatGPT Plugins. ChatGPT then handles sign-in and one-time consent.</p><p>Approval happens inside ChatGPT. BRIXTA cannot sign in on the user&apos;s behalf, register a developer app invisibly, or request an approval email from ChatGPT.</p></CardContent></Card>
        <CodeBlock code={`# Local developer fallback; hosted users do not run this\nbrew install cloudflared\nbrixta connect chatgpt --local --tenant YOUR_TENANT_ID`} />
        <Card><CardHeader><CardTitle>One-time ChatGPT approval</CardTitle><CardDescription>The CLI opens the correct page and prints the public MCP URL.</CardDescription></CardHeader><CardContent><ol className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3"><li className="rounded-2xl border p-4"><strong className="text-foreground">1. Developer mode</strong><p className="mt-2">In ChatGPT, open Settings → Security and login and enable Developer mode.</p></li><li className="rounded-2xl border p-4"><strong className="text-foreground">2. Add plugin</strong><p className="mt-2">Open Settings → Plugins, press the plus button, and paste the HTTPS URL ending in <code>/mcp</code>.</p></li><li className="rounded-2xl border p-4"><strong className="text-foreground">3. Approve OAuth</strong><p className="mt-2">Complete the one-time authorization. Future ready knowledge bases appear through the same connection.</p></li></ol></CardContent></Card>
        <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><PlugZap size={18} /> Shared tools</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{["brixta_list_knowledge_bases", "brixta_search", "brixta_get_chunk", "brixta_list_sources", "brixta_sync_source", "brixta_list_simulation_runs", "brixta_get_simulation_report"].map(tool => <div key={tool} className="rounded-xl bg-muted px-3 py-2 font-mono text-xs">{tool}</div>)}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound size={18} /> Security model</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Local mode starts an ephemeral OAuth 2.1 provider with dynamic client registration and binds the approved connection to one tenant.</p><p>Production uses Auth0 through FastMCP&apos;s OIDC proxy. OAuth client state is encrypted in Redis, while the verified subject resolves through BRIXTA&apos;s PostgreSQL tenant memberships.</p><p>Use <code>brixta disconnect</code> to stop local gateway and tunnel processes.</p></CardContent></Card></div>
      </section>

      <section id="clients" className="scroll-mt-20 space-y-5">
        <div><h2 className="text-2xl font-bold">Connect other MCP clients and Ollama</h2><p className="text-muted-foreground">BRIXTA uses standard streamable HTTP MCP. ChatGPT is one client, not a runtime requirement.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Any local MCP client</CardTitle><CardDescription>Starts a verified, tenant-bound gateway available only on your machine.</CardDescription></CardHeader><CardContent className="space-y-3"><CodeBlock code={`brixta connect client --local --tenant YOUR_TENANT_ID`} /><CodeBlock code={`{
  "mcpServers": {
    "brixta": {
      "url": "http://127.0.0.1:8001/mcp"
    }
  }
}`} /><p className="text-sm text-muted-foreground">Choose streamable HTTP when the client asks for a transport. Configuration field names vary between clients.</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Stdio clients</CardTitle><CardDescription>The client starts BRIXTA as a child process; no network listener is exposed.</CardDescription></CardHeader><CardContent><CodeBlock code={`{
  "mcpServers": {
    "brixta": {
      "command": "/path/to/Resea/bin/python",
      "args": ["-m", "api.mcp_server"],
      "env": {
        "BRIXTA_MCP_AUTH_MODE": "none",
        "BRIXTA_MCP_TENANT_ID": "YOUR_TENANT_ID",
        "BRIXTA_MCP_TRANSPORT": "stdio"
      }
    }
  }
}`} /></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Ollama model through BRIXTA</CardTitle><CardDescription>Ollama provides the model and function-calling API. An MCP host translates BRIXTA tools into Ollama tools.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2"><CodeBlock code={`ollama pull qwen3
brixta connect client --local --tenant YOUR_TENANT_ID
python -m pip install -r requirements-ollama.txt
python examples/ollama_mcp_agent.py \
  --model qwen3 \
  "Search my knowledge and answer with evidence."`} /><div className="space-y-3 text-sm text-muted-foreground"><p><strong className="text-foreground">Tool-capable model:</strong> the model may choose BRIXTA search and fetch tools itself.</p><p><strong className="text-foreground">Ordinary text model:</strong> your application searches BRIXTA first and inserts the returned chunks into the prompt.</p><p>The included bridge limits the agent to eight tool rounds and requests a 32K context window. Stop the gateway with <code>brixta disconnect</code>.</p></div></CardContent></Card>
      </section>

      <section id="production" className="scroll-mt-20 space-y-5">
        <div><h2 className="text-2xl font-bold">Production deployment</h2><p className="text-muted-foreground">Kubernetes is a deployment target, not an end-user control panel. Operate it with your platform, kubectl, GitOps, and observability stack.</p></div>
        <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><Cloud className="text-primary" /><CardTitle>Gateway</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">FastAPI and the MCP gateway run as separate deployments and scale independently.</CardContent></Card><Card><CardHeader><Database className="text-primary" /><CardTitle>State</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Use managed PostgreSQL/pgvector and shared MinIO or S3. Never rely on pod-local artifacts.</CardContent></Card><Card><CardHeader><ShieldCheck className="text-primary" /><CardTitle>Boundary</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">TLS at Ingress, JWT verification at MCP, tenant claims at every retrieval operation.</CardContent></Card></div>
        <CodeBlock code={`# Populate all seven Infisical paths first.\nexport INFISICAL_CLIENT_ID=...\nexport INFISICAL_CLIENT_SECRET=...\nexport INFISICAL_PROJECT_SLUG=...\nexport INFISICAL_ENV_SLUG=prod\nexport BRIXTA_IMAGE_TAG=sha-YOUR_COMMIT\nSECRETS_MODE=infisical ./start.sh\n\n# Hosted users connect this stable URL once:\nhttps://mcp.example.com/mcp`} />
      </section>

      <section id="plugins" className="scroll-mt-20 space-y-5">
        <div><h2 className="text-2xl font-bold">Plugin development</h2><p className="text-muted-foreground">Pipeline stages are stable contracts; implementations and model profiles are selectable.</p></div>
        <Card><CardContent className="grid gap-4 p-6 md:grid-cols-5">{["downloader", "parser", "chunker", "embedding", "storage"].map((stage, index) => <div key={stage} className="rounded-2xl border p-4"><span className="text-xs text-muted-foreground">0{index + 1}</span><p className="mt-2 font-mono text-sm">{stage}</p></div>)}</CardContent></Card>
        <div className="grid gap-4 lg:grid-cols-2"><CodeBlock code={`# 1. Implement the stage SDK contract\nplugins/<stage>/my_plugin.py\n\n# 2. Register a stable ID\nregistry.register(PluginSpec(\n    id="my-plugin",\n    stage="parser",\n    entrypoint="plugins.parser.my_plugin:MyPlugin",\n))\n\n# 3. Verify\npython -m unittest discover -s tests -v`} /><Card><CardHeader><CardTitle>Rules that preserve modularity</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">{["Keep provider imports lazy so the API remains lightweight.", "Use stable IDs; never expose Python module paths to users.", "Declare capabilities and model dimensions in the registry.", "Validate every pipeline selection before dispatch.", "Keep retrieval compatible with the original embedding profile."].map(rule => <p key={rule} className="flex gap-2"><Check className="mt-0.5 shrink-0 text-primary" size={15} /> {rule}</p>)}</CardContent></Card></div>
      </section>

      <section id="troubleshooting" className="scroll-mt-20 space-y-5 pb-12">
        <div><h2 className="text-2xl font-bold">Troubleshooting</h2><p className="text-muted-foreground">Start with the smallest boundary that can prove the next one.</p></div>
        <div className="grid gap-4 md:grid-cols-2">{[
          ["Wrong Python selected", "Run `python --version` and `which python`. Recreate Resea explicitly with python3.11."],
          ["Knowledge search returns 500", "Run `brixta doctor`; verify requirements-rag.txt, model trust settings, prefixes, and vector dimensions."],
          ["Jobs remain queued", "Check Redis, Celery workers, queue routing, and the persisted job error before retrying."],
          ["ChatGPT cannot connect", "The URL must be public HTTPS. Confirm the tunnel is alive, OAuth discovery is reachable, and the URL ends in /mcp."],
          ["Original file unavailable", "Use MinIO/S3 for shared artifacts. Machine-specific local paths are not portable between replicas."],
          ["Kubernetes status is absent", "This is intentional. BRIXTA no longer polls or mutates clusters from the user dashboard."],
        ].map(([title, body]) => <Card key={title}><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-muted-foreground">{body}</CardContent></Card>)}</div>
      </section>
    </div>
  );
}
