"use client";

import { Check, Copy, Database, ExternalLink, PlugZap, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { KnowledgeBase } from "@/types/types";

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

export default function KnowledgeConnectionCard({ knowledgeBase }: { knowledgeBase: KnowledgeBase }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Database size={19} /> Knowledge base ready</CardTitle>
            <CardDescription>{knowledgeBase.chunk_count} searchable chunks · {knowledgeBase.embedding_model} · {knowledgeBase.embedding_dimension}d</CardDescription>
          </div>
          <Badge>ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-background/70 p-3">
          <p className="text-xs font-medium text-muted-foreground">BRIXTA handle</p>
          <code className="mt-1 block break-all text-sm">{knowledgeBase.uri}</code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" render={<Link href={`/knowledge/${knowledgeBase.id}`} />}>
            <Search size={14} /> Open retrieval
          </Button>
          <CopyValue value={knowledgeBase.uri} label="Copy handle" />
          <CopyValue value={knowledgeBase.retrieval_url} label="Copy retrieval API" />
          <CopyValue value={knowledgeBase.mcp_command} label="Copy MCP command" />
        </div>
        <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground"><PlugZap size={14} /> ChatGPT and MCP clients</p>
          <p className="mt-1">
            {knowledgeBase.chatgpt_ready
              ? "Your configured MCP URL uses HTTPS and can be added as a developer-mode ChatGPT app."
              : "Local retrieval is ready. ChatGPT requires this MCP server to be deployed at a public HTTPS URL with authentication."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyValue value={knowledgeBase.mcp_url} label="Copy MCP URL" />
            <Button size="sm" variant="ghost" render={<a href={knowledgeBase.manifest_url} target="_blank" rel="noreferrer" />}>
              Manifest <ExternalLink size={13} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
