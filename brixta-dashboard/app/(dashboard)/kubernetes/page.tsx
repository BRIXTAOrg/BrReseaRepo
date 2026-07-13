"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, FileTerminal, RefreshCw, RotateCcw, ServerCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPythonApi } from "@/lib/api";

interface Pod { name: string; namespace: string; status: string; node?: string; ready: boolean; restarts: number; created_at?: string; containers: { name: string; image: string }[] }
interface Deployment { name: string; namespace: string; replicas: number; available: number; updated: number; unavailable: number; ready: boolean; images: string[] }

export default function KubernetesPage() {
  const [health, setHealth] = useState<{ healthy?: boolean; error?: string; version?: string }>({});
  const [pods, setPods] = useState<Pod[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [namespace, setNamespace] = useState("all");
  const [logs, setLogs] = useState<{ title: string; body: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [h, p, d] = await Promise.all([
        requestPythonApi<{ healthy: boolean; error?: string; version?: string }>("/prod/kubernetes"),
        requestPythonApi<{ pods: Pod[] }>("/prod/kubernetes/pods"),
        requestPythonApi<{ deployments: Deployment[] }>("/prod/kubernetes/deployments"),
      ]);
      setHealth(h); setPods(p.pods || []); setDeployments(d.deployments || []);
    } catch (reason) { setHealth({ healthy: false, error: reason instanceof Error ? reason.message : "Cluster unavailable" }); }
  }, []);

  useEffect(() => { const initial = window.setTimeout(load, 0); const timer = window.setInterval(load, 10_000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [load]);
  const namespaces = useMemo(() => Array.from(new Set([...pods.map((item) => item.namespace), ...deployments.map((item) => item.namespace)])).sort(), [pods, deployments]);
  const visiblePods = namespace === "all" ? pods : pods.filter((item) => item.namespace === namespace);
  const visibleDeployments = namespace === "all" ? deployments : deployments.filter((item) => item.namespace === namespace);

  async function restartDeployment(item: Deployment) {
    if (!window.confirm(`Restart deployment ${item.namespace}/${item.name}? Kubernetes will perform a rolling rollout.`)) return;
    const key = `deployment:${item.namespace}/${item.name}`; setBusy(key); setMessage("");
    try { await requestPythonApi(`/prod/kubernetes/deployments/${item.namespace}/${item.name}/restart`, { method: "POST" }); setMessage(`Rolling restart requested for ${item.name}.`); await load(); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Restart failed."); }
    finally { setBusy(null); }
  }

  async function restartPod(item: Pod) {
    if (!window.confirm(`Replace pod ${item.namespace}/${item.name}? Its controller must be available to recreate it.`)) return;
    const key = `pod:${item.namespace}/${item.name}`; setBusy(key); setMessage("");
    try { await requestPythonApi(`/prod/kubernetes/pods/${item.namespace}/${item.name}/restart`, { method: "POST" }); setMessage(`Replacement requested for ${item.name}.`); await load(); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Pod replacement failed."); }
    finally { setBusy(null); }
  }

  async function showLogs(item: Pod) {
    const key = `logs:${item.namespace}/${item.name}`; setBusy(key);
    try { const value = await requestPythonApi<{ logs: string }>(`/prod/kubernetes/pods/${item.namespace}/${item.name}/logs`); setLogs({ title: `${item.namespace}/${item.name}`, body: value.logs }); }
    catch (reason) { setLogs({ title: "Logs unavailable", body: reason instanceof Error ? reason.message : "Unknown error" }); }
    finally { setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="flex items-center gap-3 text-3xl font-bold"><Boxes /> Kubernetes control</h1><p className="text-muted-foreground">Observe production state, inspect logs, and request safe controller-managed restarts.</p></div><div className="flex gap-2"><select className="h-9 rounded-xl border bg-background px-3 text-sm" value={namespace} onChange={(event) => setNamespace(event.target.value)}><option value="all">All namespaces</option>{namespaces.map((value) => <option key={value}>{value}</option>)}</select><Button variant="outline" onClick={() => void load()}><RefreshCw size={15} /> Refresh</Button></div></div>
      {!health.healthy ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4"><p className="font-medium text-destructive">Cluster not connected</p><p className="mt-1 text-xs text-muted-foreground">{health.error || "Configure kubeconfig or the in-cluster service account."}</p></div> : <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Cluster</p><p className="mt-1 font-semibold">Online {health.version || ""}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Deployments</p><p className="mt-1 text-2xl font-semibold">{visibleDeployments.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Running pods</p><p className="mt-1 text-2xl font-semibold">{visiblePods.filter((item) => item.ready).length}/{visiblePods.length}</p></CardContent></Card></div>}
      {message && <div className="rounded-xl border bg-muted/50 p-3 text-sm">{message}</div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ServerCog size={18} /> Deployments</CardTitle><CardDescription>Restart patches the pod template and lets Kubernetes perform a rolling rollout.</CardDescription></CardHeader><CardContent className="space-y-3">{visibleDeployments.map((item) => <div key={`${item.namespace}/${item.name}`} className="rounded-2xl border p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-medium">{item.name}</p><Badge variant={item.ready ? "default" : "secondary"}>{item.ready ? "ready" : "degraded"}</Badge></div><p className="text-xs text-muted-foreground">{item.namespace} · {item.available}/{item.replicas} available · {item.updated} updated</p></div><Button size="sm" variant="outline" onClick={() => restartDeployment(item)} disabled={busy === `deployment:${item.namespace}/${item.name}`}><RotateCcw size={14} /> Restart</Button></div><p className="mt-3 truncate rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">{item.images.join(", ")}</p></div>)}{visibleDeployments.length === 0 && <p className="text-muted-foreground">No deployments available.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Pods</CardTitle><CardDescription>Read logs or replace a pod through its owning controller.</CardDescription></CardHeader><CardContent className="space-y-3">{visiblePods.map((item) => <div key={`${item.namespace}/${item.name}`} className="rounded-2xl border p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-medium">{item.name}</p><Badge variant={item.ready ? "default" : "secondary"}>{item.status}</Badge></div><p className="text-xs text-muted-foreground">{item.namespace} · {item.node || "unassigned"} · {item.restarts} restarts</p></div><div className="flex gap-1"><Button size="sm" variant="ghost" title="View logs" onClick={() => showLogs(item)} disabled={busy === `logs:${item.namespace}/${item.name}`}><FileTerminal size={15} /></Button><Button size="sm" variant="outline" title="Replace pod" onClick={() => restartPod(item)} disabled={busy === `pod:${item.namespace}/${item.name}`}><RotateCcw size={14} /></Button></div></div></div>)}{visiblePods.length === 0 && <p className="text-muted-foreground">No pods available.</p>}</CardContent></Card>
      </div>
      {logs && <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>{logs.title}</CardTitle><CardDescription>Latest 200 timestamped lines</CardDescription></div><Button variant="ghost" onClick={() => setLogs(null)}>Close</Button></div></CardHeader><CardContent><pre className="max-h-[32rem] overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs whitespace-pre-wrap text-zinc-100">{logs.body}</pre></CardContent></Card>}
    </div>
  );
}
