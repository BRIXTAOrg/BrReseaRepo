"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, FlaskConical, LoaderCircle, Play, ShieldCheck } from "lucide-react";

import SimulationViewer from "@/components/simulations/SimulationViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPythonApi } from "@/lib/api";
import type { KnowledgeBase, SimulationCaseCard, SimulationPreflight, SimulationRun } from "@/types/types";

function defaultsFor(card: SimulationCaseCard | undefined): Record<string, number> {
  const values: Record<string, number> = {};
  for (const [name, property] of Object.entries(card?.parameter_schema.properties || {})) {
    if (typeof property.default === "number") values[name] = property.default;
  }
  return values;
}

export default function SimulationsPage() {
  const [tenantId, setTenantId] = useState("default");
  const [label, setLabel] = useState("Engineering screening run");
  const [caseCardId, setCaseCardId] = useState("");
  const [executionMode, setExecutionMode] = useState<"preview" | "solver">("preview");
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [cards, setCards] = useState<SimulationCaseCard[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [preflight, setPreflight] = useState<SimulationPreflight | null>(null);
  const [busy, setBusy] = useState<"preflight" | "run" | null>(null);
  const [error, setError] = useState("");

  const card = cards.find((item) => item.id === caseCardId) || cards[0];
  const properties = Object.entries(card?.parameter_schema.properties || {});
  const groups = useMemo(() => {
    const result = new Map<string, typeof properties>();
    for (const entry of properties) {
      const property = entry[1];
      const group = property.group || property.json_schema_extra?.group || "Parameters";
      result.set(group, [...(result.get(group) || []), entry]);
    }
    return [...result.entries()];
  }, [properties]);
  const payload = useMemo(() => ({
    tenant_id: tenantId,
    case_card_id: card?.id || "structural_coupon_tension_v1",
    parameters,
    knowledge_base_ids: selectedKnowledge,
    evidence_query: `engineering properties boundary conditions solver assumptions ${card?.analysis_type || "simulation"}`,
  }), [tenantId, card?.id, card?.analysis_type, parameters, selectedKnowledge]);

  const refresh = useCallback(async () => {
    const [runData, knowledgeData] = await Promise.all([
      requestPythonApi<{ runs: SimulationRun[] }>(`/prod/simulations/runs?tenant_id=${encodeURIComponent(tenantId)}`),
      requestPythonApi<{ knowledge_bases: KnowledgeBase[] }>(`/prod/knowledge?tenant_id=${encodeURIComponent(tenantId)}`),
    ]);
    setRuns(runData.runs);
    setKnowledge(knowledgeData.knowledge_bases);
  }, [tenantId]);

  useEffect(() => {
    requestPythonApi<{ case_cards: SimulationCaseCard[] }>("/prod/simulations/case-cards")
      .then((response) => {
        setCards(response.case_cards);
        const first = response.case_cards[0];
        if (first) {
          setCaseCardId(first.id);
          setParameters(defaultsFor(first));
          setLabel(`${first.name} screening`);
        }
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh().catch((reason: Error) => setError(reason.message)), 0);
    const timer = window.setInterval(() => void refresh().catch(() => undefined), 3000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  function chooseCard(id: string) {
    const selected = cards.find((item) => item.id === id);
    setCaseCardId(id);
    setParameters(defaultsFor(selected));
    setLabel(selected ? `${selected.name} screening` : "Engineering screening run");
    setPreflight(null);
  }

  function setNumber(name: string, value: string) {
    setParameters((current) => ({ ...current, [name]: Number(value) }));
    setPreflight(null);
  }

  async function validate(event: FormEvent) {
    event.preventDefault(); setBusy("preflight"); setError("");
    try {
      setPreflight(await requestPythonApi<SimulationPreflight>("/prod/simulations/preflight", { method: "POST", body: JSON.stringify(payload) }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Preflight failed."); }
    finally { setBusy(null); }
  }

  async function run() {
    setBusy("run"); setError("");
    try {
      await requestPythonApi("/prod/simulations/runs", { method: "POST", body: JSON.stringify({ ...payload, execution_mode: executionMode, label }) });
      setPreflight(null);
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not queue simulation."); }
    finally { setBusy(null); }
  }

  const metrics = Object.entries(preflight?.analytical_reference || {}).filter(([, value]) => typeof value === "number").slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="flex items-center gap-3 text-3xl font-bold"><FlaskConical /> Engineering Simulation Lab</h1><p className="text-muted-foreground">Validated JSON Case Cards compile into real CalculiX and OpenFOAM projects—without runtime C++ generation.</p></div>
        <Badge variant="secondary">Integration Pack 04</Badge>
      </div>

      {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <div className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
        <Card>
          <CardHeader><CardTitle>Configure a Case Card</CardTitle><CardDescription>Select an approved solver template, adjust bounded inputs, validate, then export or run it.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={validate} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2"><Label htmlFor="case-card">Case Card</Label><select id="case-card" className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={card?.id || ""} onChange={(event) => chooseCard(event.target.value)}>{cards.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.solver}</option>)}</select></div>
                <div className="space-y-2"><Label htmlFor="execution-mode">Execution mode</Label><select id="execution-mode" className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={executionMode} onChange={(event) => setExecutionMode(event.target.value as "preview" | "solver")}><option value="preview">Preview + export</option><option value="solver">Run isolated solver</option></select></div>
              </div>
              {card ? <div className="rounded-2xl border bg-muted/30 p-4 text-sm"><p className="font-medium">{card.name}</p><p className="mt-1 text-muted-foreground">{card.description}</p><p className="mt-2 text-xs text-muted-foreground">{card.analysis_type} · {card.solver} · {card.version}</p></div> : null}
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="sim-tenant">Tenant</Label><Input id="sim-tenant" value={tenantId} onChange={(event) => { setTenantId(event.target.value); setSelectedKnowledge([]); }} required /></div><div className="space-y-2"><Label htmlFor="sim-label">Run label</Label><Input id="sim-label" value={label} onChange={(event) => setLabel(event.target.value)} /></div></div>
              {groups.map(([group, fields]) => <fieldset key={group} className="space-y-3 rounded-2xl border p-4"><legend className="px-2 text-sm font-semibold">{group}</legend><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{fields.map(([name, property]) => {
                const unit = property.unit || property.json_schema_extra?.unit;
                return <div key={name} className="space-y-2"><Label htmlFor={name}>{property.title || name.replaceAll("_", " ")}{unit ? ` · ${unit}` : ""}</Label><Input id={name} type="number" step="any" min={property.minimum} max={property.maximum} value={parameters[name] ?? ""} onChange={(event) => setNumber(name, event.target.value)} required /><p className="line-clamp-2 text-[11px] text-muted-foreground">{property.description}</p></div>;
              })}</div></fieldset>)}
              <div className="space-y-2"><Label>Optional engineering evidence</Label><div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border p-3">{knowledge.map((item) => <label key={item.id} className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={selectedKnowledge.includes(item.id)} onChange={(event) => setSelectedKnowledge((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span><span className="font-medium">{item.name}</span><span className="block text-xs text-muted-foreground">{item.chunk_count} chunks · {item.embedding_model}</span></span></label>)}{knowledge.length === 0 && <p className="text-sm text-muted-foreground">No completed knowledge bases for tenant “{tenantId}”. Explicit Case Card values can still be validated.</p>}</div></div>
              <div className="flex flex-wrap gap-3"><Button type="submit" variant="outline" disabled={busy !== null || !card}>{busy === "preflight" ? <LoaderCircle className="animate-spin" size={15} /> : <ShieldCheck size={15} />} Validate & compile</Button><Button type="button" disabled={!preflight || busy !== null} onClick={run}>{busy === "run" ? <LoaderCircle className="animate-spin" size={15} /> : <Play size={15} />} {executionMode === "preview" ? "Save preview" : `Queue ${card?.solver || "solver"}`}</Button></div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Preflight</CardTitle><CardDescription>Only validated values enter deterministic templates.</CardDescription></CardHeader><CardContent className="space-y-3">{preflight ? <><div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={17} /> Case is valid and compiled</div><div className="grid grid-cols-2 gap-3 text-sm">{metrics.map(([name, value]) => <div key={name} className="rounded-xl bg-muted p-3"><p className="truncate text-xs text-muted-foreground">{name.replaceAll("_", " ")}</p><p className="font-semibold">{Number(value).toPrecision(5)}</p></div>)}</div><p className="text-sm">Generated files: <strong>{preflight.compiled_files.length}</strong> · Evidence: <strong>{preflight.evidence.length}</strong></p><ul className="space-y-1 text-xs text-muted-foreground">{preflight.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></> : <p className="text-sm text-muted-foreground">Validate a Case Card to derive quantities, retrieve evidence, compile files, and activate the simulator preview.</p>}</CardContent></Card>
          {preflight ? <SimulationViewer scene={preflight.visualization} /> : null}
          <Card><CardHeader><CardTitle>Safety boundary</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Models may retrieve evidence or propose values. They cannot inject commands or rewrite OpenFOAM C++. BRIXTA validates JSON and fills approved templates; isolated workers run fixed command pipelines.</CardContent></Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity size={18} /> Run history</CardTitle><CardDescription>Live status, reports, native solver files, generated case ZIPs, and provenance.</CardDescription></CardHeader>
        <CardContent className="space-y-3">{runs.map((run) => <Link key={run.id} href={`/simulations/${run.id}?tenant=${encodeURIComponent(run.tenant_id)}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50"><div><p className="font-medium">{run.label || run.case_card_id}</p><p className="text-xs text-muted-foreground">{run.execution_mode} · {run.solver} · {run.id}</p></div><Badge variant={run.status === "failed" ? "destructive" : run.status === "completed" ? "default" : "secondary"}>{run.status}</Badge></Link>)}{runs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No simulation runs for this tenant yet.</p>}</CardContent>
      </Card>
    </div>
  );
}
