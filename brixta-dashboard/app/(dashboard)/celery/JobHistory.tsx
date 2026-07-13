"use client";

import Link from "next/link";
import { Database, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPythonApi } from "@/lib/api";
import type { Job } from "@/types/types";

export type { Job } from "@/types/types";

export default function JobHistory({ initialJobs, initialError }: { initialJobs: Job[]; initialError?: string }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [message, setMessage] = useState(initialError || "");
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    const result = await requestPythonApi<{ jobs: Job[]; error?: string }>("/prod/jobs");
    setJobs(result.jobs || []);
    setMessage(result.error || "");
  }

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  async function retry(job: Job) {
    setBusy(job.id);
    setMessage("");
    try {
      const result = await requestPythonApi<{ message: string; job_id: string; run: number; max_runs: number }>(`/prod/jobs/${job.id}/retry`, { method: "POST" });
      setMessage(`${result.message} New job ${result.job_id}; run ${result.run}/${result.max_runs}.`);
      await refresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not retry this job.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline history</CardTitle>
        <CardDescription>{message || `${jobs.length} persisted job(s)`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {jobs.map((job) => (
          <div key={job.id} className="grid gap-3 border p-3 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <p className="break-all font-medium">{job.source_target}</p>
              <p className="text-xs text-muted-foreground">
                {job.tenant_id} · {job.source_type} · {job.id}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Stage: {job.current_stage || "none"} · stage attempt {job.attempt_count}/{job.max_attempts} · pipeline run {job.retry_count + 1}/{job.max_job_runs}
              </p>
              {job.parent_job_id && <p className="text-xs text-muted-foreground">Retried from {job.parent_job_id}</p>}
              {job.error && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap border-l-2 border-destructive pl-3 text-xs text-destructive">{job.error}</pre>}
              {job.status === "failed" && !job.retryable && <p className="mt-2 text-xs text-muted-foreground">Permanent failure: change the input or configuration before submitting a new job.</p>}
              {job.status === "failed" && job.retryable && !job.can_retry && <p className="mt-2 text-xs text-muted-foreground">This retry chain has reached its maximum number of runs.</p>}
            </div>
            <div className="flex items-start gap-2">
              <Badge variant={job.status === "completed" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge>
              {job.status === "completed" && (
                <Button size="sm" variant="outline" render={<Link href={`/knowledge/${job.id}`} />}>
                  <Database size={14} /> Knowledge
                </Button>
              )}
              {job.can_retry && <Button size="sm" variant="outline" onClick={() => retry(job)} disabled={busy === job.id}>{busy === job.id ? "Retrying…" : "Retry"}</Button>}
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-muted-foreground">No persisted jobs.</p>}
        <Button size="sm" variant="ghost" type="button" onClick={() => void refresh()}>
          <RefreshCw size={14} /> Refresh now
        </Button>
      </CardContent>
    </Card>
  );
}
