// app/(dashboard)/dashboard/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardOverview() {
  // Fetch top-level summaries from the core infrastructure pillars
  const [healthData, celeryData, dockerData, storageData] = await Promise.all([
    fetchPythonApi("/prod/health", { cache: "no-store" }),
    fetchPythonApi("/prod/celery", { cache: "no-store" }),
    fetchPythonApi("/prod/docker", { cache: "no-store" }),
    fetchPythonApi("/prod/storage/health", { cache: "no-store" }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">
            Bird's-eye view of the vectorization pipeline and infrastructure.
          </p>
        </div>
        <Link href="/ingestion">
          <Button>+ New Ingestion Job</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Health Overview */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Core API Health</h2>
            <Link href="/health" className="text-xs text-blue-500 hover:underline">View details →</Link>
          </div>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>

        {/* Celery Pipeline Overview */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Celery Pipeline</h2>
            <Link href="/jobs" className="text-xs text-blue-500 hover:underline">View details →</Link>
          </div>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(celeryData, null, 2)}
          </pre>
        </div>

        {/* Docker Engine Overview */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Docker Engine</h2>
            <Link href="/docker" className="text-xs text-blue-500 hover:underline">View details →</Link>
          </div>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(dockerData, null, 2)}
          </pre>
        </div>

        {/* Storage Overview */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col hover:border-primary/50 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Storage Backend</h2>
            <Link href="/storage" className="text-xs text-blue-500 hover:underline">View details →</Link>
          </div>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(storageData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}