"use client";

import { FormEvent, useEffect, useState } from "react";
import { HardDrive, Puzzle, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPythonApi } from "@/lib/api";
import type { PluginSpec, PluginStage, PluginsResponse } from "@/types/types";

interface Settings {
  artifact_backend: string;
  minio_endpoint: string;
  minio_console_url: string;
  minio_bucket: string;
  default_plugins: Record<PluginStage, string>;
  embedding_model: string;
  pipeline_order: PluginStage[];
}

const canonical: PluginStage[] = ["downloader", "parser", "chunker", "embedding", "storage"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [plugins, setPlugins] = useState<PluginSpec[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      requestPythonApi<{ settings: Settings }>("/prod/settings/control-plane"),
      requestPythonApi<PluginsResponse>("/plugins"),
    ]).then(([configuration, catalog]) => {
      setSettings(configuration.settings);
      setPlugins(catalog.plugins);
    }).catch((reason: Error) => setMessage(reason.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true); setMessage(null);
    try {
      const result = await requestPythonApi<{ message: string; restart_required: boolean }>("/prod/settings/control-plane", { method: "PUT", body: JSON.stringify(settings) });
      setMessage(`${result.message}${result.restart_required ? " Restart required." : ""}`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not save settings.");
    } finally { setSaving(false); }
  }

  if (!settings) return <div className="p-8"><h1 className="text-3xl font-bold">Settings</h1><p className="mt-3 text-muted-foreground">{message || "Loading control-plane settings…"}</p></div>;

  return (
    <form onSubmit={save} className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Runtime settings</h1><p className="text-muted-foreground">Infrastructure and unattended-job defaults. Per-job models remain on the ingestion screen.</p></div><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button></div>
      {message && <div className="rounded-xl border bg-muted/40 p-3 text-sm">{message}</div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HardDrive size={18} /> Artifact storage</CardTitle><CardDescription>Choose where raw documents and intermediate artifacts live. Vectors remain in PostgreSQL/pgvector.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="backend">Backend</Label><select id="backend" className="h-9 w-full rounded-xl border bg-background px-3" value={settings.artifact_backend} onChange={(event) => setSettings({ ...settings, artifact_backend: event.target.value })}><option value="local">Local filesystem</option><option value="minio">MinIO / S3-compatible</option></select></div>
            {settings.artifact_backend === "minio" && <><div className="space-y-2"><Label htmlFor="minio-endpoint">MinIO API endpoint</Label><Input id="minio-endpoint" value={settings.minio_endpoint} onChange={(event) => setSettings({ ...settings, minio_endpoint: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="minio-console">Console URL</Label><Input id="minio-console" value={settings.minio_console_url} onChange={(event) => setSettings({ ...settings, minio_console_url: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="minio-bucket">Bucket</Label><Input id="minio-bucket" value={settings.minio_bucket} onChange={(event) => setSettings({ ...settings, minio_bucket: event.target.value })} /></div></>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Puzzle size={18} /> Unattended-job defaults</CardTitle><CardDescription>Used by scheduled sources and API calls that omit plugin choices. The ingestion screen can override these per job.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {canonical.map((stage) => <div key={stage} className="space-y-2"><Label htmlFor={`default-${stage}`} className="capitalize">{stage}</Label><select id={`default-${stage}`} className="h-9 w-full rounded-xl border bg-background px-3" value={settings.default_plugins[stage]} onChange={(event) => setSettings({ ...settings, default_plugins: { ...settings.default_plugins, [stage]: event.target.value } })}>{plugins.filter((plugin) => plugin.stage === stage).map((plugin) => <option key={plugin.id} value={plugin.id}>{plugin.name}</option>)}</select></div>)}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck size={18} /> Safe pipeline contract</CardTitle><CardDescription>Downloader → parser → chunker → embedding → storage is fixed. Modularity comes from replacing each implementation, not rearranging incompatible artifact stages.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Install and inspect implementations from the plugin catalog.</p><Button type="button" variant="outline" render={<Link href="/plugins" />}>Open plugin catalog</Button></CardContent>
      </Card>
    </form>
  );
}
