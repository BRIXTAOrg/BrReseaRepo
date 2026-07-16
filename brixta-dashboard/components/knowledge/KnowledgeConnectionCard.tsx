"use client";

import {
  Check,
  ChevronDown,
  Copy,
  Database,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  LogIn,
  MailWarning,
  MessageSquareText,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestPythonApi } from "@/lib/api";
import type { KnowledgeBase } from "@/types/types";

interface ChatGptConnection {
  gateway_available: boolean;
  gateway_configured: boolean;
  mode: string;
  mcp_url: string | null;
  auth_mode: string | null;
  authenticated: boolean;
  shared_gateway: boolean;
  distribution: "developer" | "published";
  chatgpt_settings_url: string;
  manual_app_creation_required: boolean;
  approval_location: "chatgpt";
  email_approval_available: false;
  chatgpt_account_connected: null;
  issues: string[];
}

interface ChatGptHandoff {
  knowledge_base_id: string;
  tenant_id: string;
  access_enabled: boolean;
  connection: ChatGptConnection;
  steps: string[];
}

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <Button type="button" size="sm" variant="outline" onClick={copy}>
      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : label}
    </Button>
  );
}

function Step({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border bg-background/70 p-3">
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {done ? <Check size={14} /> : <span className="size-2 rounded-full bg-current" />}
      </span>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

export default function KnowledgeConnectionCard({ knowledgeBase }: { knowledgeBase: KnowledgeBase }) {
  const [handoff, setHandoff] = useState<ChatGptHandoff | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState<"load" | "prepare" | null>("load");
  const [openedChatGpt, setOpenedChatGpt] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setBusy("load");
    setError("");
    try {
      setHandoff(await requestPythonApi<ChatGptHandoff>(`/prod/knowledge/${knowledgeBase.id}/chatgpt-connection`));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not inspect the MCP gateway.");
    } finally {
      setBusy(null);
    }
  }, [knowledgeBase.id]);

  useEffect(() => {
    let active = true;
    requestPythonApi<ChatGptHandoff>(`/prod/knowledge/${knowledgeBase.id}/chatgpt-connection`)
      .then((result) => {
        if (active) setHandoff(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not inspect the MCP gateway.");
      })
      .finally(() => {
        if (active) setBusy(null);
      });
    return () => { active = false; };
  }, [knowledgeBase.id]);

  async function setAccess(enabled: boolean) {
    setBusy("prepare");
    setError("");
    try {
      if (enabled) {
        setHandoff(await requestPythonApi<ChatGptHandoff>(`/prod/knowledge/${knowledgeBase.id}/chatgpt-connection`, { method: "POST" }));
      } else {
        await requestPythonApi(`/prod/knowledge/${knowledgeBase.id}/access`, {
          method: "PUT",
          body: JSON.stringify({ enabled: false }),
        });
        setHandoff((current) => current ? { ...current, access_enabled: false } : current);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update knowledge access.");
    } finally {
      setBusy(null);
    }
  }

  async function openChatGpt() {
    if (!handoff?.connection.mcp_url) return;
    window.open(handoff.connection.chatgpt_settings_url, "_blank", "noopener,noreferrer");
    try { await navigator.clipboard.writeText(handoff.connection.mcp_url); } catch { /* Browser may deny clipboard; URL remains visible. */ }
    setOpenedChatGpt(true);
  }

  const gatewayOnline = Boolean(handoff?.connection.gateway_available);
  const accessEnabled = handoff?.access_enabled ?? true;

  return (
    <>
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><Database size={19} /> Knowledge base ready</CardTitle>
              <CardDescription>{knowledgeBase.chunk_count} searchable chunks · {knowledgeBase.embedding_model} · {knowledgeBase.embedding_dimension}d</CardDescription>
            </div>
            <div className="flex gap-2"><Badge className="gap-1"><ShieldCheck size={12} /> ready</Badge>{gatewayOnline && <Badge variant="secondary">MCP ready</Badge>}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Button render={<Link href={`/knowledge/${knowledgeBase.id}#retrieval`} />}>
              <Search size={15} /> Search knowledge
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <MessageSquareText size={15} /> Use with ChatGPT
            </Button>
          </div>

          <div className="rounded-2xl border bg-muted/35 p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 text-primary" size={18} />
              <div>
                <p className="text-sm font-medium">Tenant-scoped access</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The shared gateway derives tenant <strong className="text-foreground">{knowledgeBase.tenant_id}</strong> from authenticated credentials. This knowledge base is <strong className="text-foreground">{accessEnabled ? "available" : "hidden"}</strong> to that tenant&apos;s MCP clients.
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void setAccess(!accessEnabled)} disabled={busy !== null}>
                  {busy === "prepare" ? "Saving…" : accessEnabled ? "Disable MCP access" : "Enable MCP access"}
                </Button>
              </div>
            </div>
          </div>

          <details className="group rounded-2xl border bg-background/60 p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
              Developer details
              <ChevronDown className="transition-transform group-open:rotate-180" size={16} />
            </summary>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Stable BRIXTA handle</p>
                <code className="mt-1 block break-all text-xs">{knowledgeBase.uri}</code>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyValue value={knowledgeBase.uri} label="Copy handle" />
                <CopyValue value={knowledgeBase.retrieval_url} label="Copy retrieval API" />
                <CopyValue value={handoff?.connection.mcp_url || knowledgeBase.mcp_url} label="Copy shared MCP URL" />
                <Button size="sm" variant="ghost" render={<a href={knowledgeBase.manifest_url} target="_blank" rel="noreferrer" />}>
                  Manifest <ExternalLink size={13} />
                </Button>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg"><MessageSquareText size={20} /> Use this knowledge in ChatGPT</DialogTitle>
            <DialogDescription>
              BRIXTA prepares one tenant-scoped shared MCP gateway. ChatGPT owns account sign-in and the final consent screen.
            </DialogDescription>
          </DialogHeader>

          {busy === "load" && !handoff ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={18} /> Checking connection…</div> : null}
          {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

          {handoff ? <div className="space-y-3">
            <Step done={handoff.access_enabled}>
              <p className="font-medium">1. Allow this knowledge base</p>
              <p className="mt-1 text-xs text-muted-foreground">Only authenticated users in tenant <strong>{handoff.tenant_id}</strong> can discover it.</p>
              {!handoff.access_enabled ? <Button className="mt-3" size="sm" onClick={() => void setAccess(true)} disabled={busy !== null}>{busy === "prepare" ? <LoaderCircle className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Enable securely</Button> : null}
            </Step>

            <Step done={handoff.connection.gateway_available}>
              <p className="font-medium">2. Shared MCP gateway</p>
              {handoff.connection.mcp_url ? <code className="mt-1 block break-all rounded-lg bg-muted px-2 py-1 text-xs">{handoff.connection.mcp_url}</code> : null}
              {handoff.connection.issues.length ? <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{handoff.connection.issues.map((issue) => <li key={issue}>• {issue}</li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">Public HTTPS and discoverable OAuth are configured.</p>}
              {!handoff.connection.gateway_available ? <div className="mt-3 rounded-xl bg-muted p-3 text-xs"><p className="font-medium">Local development</p><code className="mt-1 block break-all">brixta connect chatgpt --local --tenant {knowledgeBase.tenant_id}</code><p className="mt-2 text-muted-foreground">Production uses one permanently deployed gateway with JWT/OAuth discovery; ordinary hosted users do not run this command.</p></div> : null}
            </Step>

            <Step done={openedChatGpt}>
              <p className="font-medium">3. Sign in and approve inside ChatGPT</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {handoff.connection.manual_app_creation_required ? "Developer mode requires creating the BRIXTA app once and pasting the copied MCP URL." : "The published BRIXTA plugin opens its normal OAuth connection flow."}
              </p>
              <Button className="mt-3" size="sm" onClick={() => void openChatGpt()} disabled={!handoff.access_enabled || !handoff.connection.gateway_available}>
                <LogIn size={14} /> Copy MCP URL & open ChatGPT
              </Button>
            </Step>

            <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-muted-foreground">
              <MailWarning className="mt-0.5 shrink-0 text-amber-600" size={17} />
              <p><strong className="text-foreground">Approval is in ChatGPT, not email.</strong> OpenAI&apos;s documented MCP flow does not provide BRIXTA an API to sign in, register a developer app, or request a ChatGPT approval email on a user&apos;s behalf. After the one-time approval, new enabled knowledge bases appear through the same gateway without reconnecting.</p>
            </div>
          </div> : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => void refresh()} disabled={busy !== null}><RefreshCcw size={14} /> Refresh readiness</Button>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
