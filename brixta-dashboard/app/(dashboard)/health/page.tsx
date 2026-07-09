// app/(dashboard)/health/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";

export default async function HealthPage() {
  // Fetch all health data in parallel using the centralized fetcher
  // Pass { cache: "no-store" } as the options parameter
  const [
    overallData, 
    dbData, 
    redisData, 
    storageData, 
    k8sData
  ] = await Promise.all([
    fetchPythonApi("/prod/health", { cache: "no-store" }),
    fetchPythonApi("/prod/health/database", { cache: "no-store" }),
    fetchPythonApi("/prod/health/redis", { cache: "no-store" }),
    fetchPythonApi("/prod/health/storage", { cache: "no-store" }),
    fetchPythonApi("/prod/health/kubernetes", { cache: "no-store" }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Live infrastructure diagnostics fetched from Python API.
          </p>
        </div>
        {/* Later, you could add a "Refresh" button here using a Server Action or router.refresh() */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overall Health Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Overall Status</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(overallData, null, 2)}
          </pre>
        </div>

        {/* Database Health Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Database
          </h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(dbData, null, 2)}
          </pre>
        </div>

        {/* Redis Health Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Redis Cache
          </h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(redisData, null, 2)}
          </pre>
        </div>

        {/* Storage Health Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> MinIO Storage
          </h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(storageData, null, 2)}
          </pre>
        </div>

        {/* Kubernetes Health Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Kubernetes
          </h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-64">
            {JSON.stringify(k8sData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}