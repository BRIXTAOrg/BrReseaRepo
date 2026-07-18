import { Database, FileText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPythonApiServer } from "@/lib/server-api";
import type { KnowledgeBase } from "@/types/types";

export default async function KnowledgePage() {
  const response = await fetchPythonApiServer("/prod/knowledge") as { knowledge_bases?: KnowledgeBase[]; error?: string };
  const items = response.knowledge_bases || [];
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div><h1 className="flex items-center gap-3 text-3xl font-bold"><Database /> Knowledge bases</h1><p className="text-muted-foreground">Completed pipelines that are ready for semantic retrieval and MCP access.</p></div>
      {response.error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{response.error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="transition-transform hover:-translate-y-0.5">
            <CardHeader><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate text-lg">{item.name}</CardTitle><CardDescription className="truncate">{item.source_target}</CardDescription></div><Badge>ready</Badge></div></CardHeader>
            <CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Chunks</p><p className="font-semibold">{item.chunk_count}</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Dimensions</p><p className="font-semibold">{item.embedding_dimension}</p></div></div><p className="truncate text-xs text-muted-foreground">{item.embedding_model}</p><Button className="w-full" render={<Link href={`/knowledge/${item.id}`} />}><FileText size={15} /> Open knowledge base</Button></CardContent>
          </Card>
        ))}
      </div>
      {items.length === 0 && <Card><CardContent className="p-10 text-center"><Database className="mx-auto mb-3 text-muted-foreground" /><p className="font-medium">No ready knowledge bases</p><p className="text-sm text-muted-foreground">Complete an ingestion pipeline first.</p></CardContent></Card>}
    </div>
  );
}
