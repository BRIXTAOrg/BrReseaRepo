// app/(dashboard)/storage/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";

export default async function StoragePage() {
  // Fetch data in parallel to prevent waterfall requests
  const [
    providerData, 
    healthData, 
    statsData
  ] = await Promise.all([
    fetchPythonApi("/prod/storage", {cache: "no-store"}),
    fetchPythonApi("/prod/storage/health", {cache: "no-store"}),
    fetchPythonApi("/prod/storage/statistics", {cache: "no-store"}),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Storage Overview</h1>
      <p className="text-muted-foreground">
        Live data fetched directly from Python backend.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Provider Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card">
          <h2 className="text-lg font-semibold mb-2">Provider</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground">
            {JSON.stringify(providerData, null, 2)}
          </pre>
        </div>

        {/* Health Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card">
          <h2 className="text-lg font-semibold mb-2">System Health</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>

        {/* Statistics Block */}
        <div className="p-4 border rounded-xl shadow-sm bg-card">
          <h2 className="text-lg font-semibold mb-2">Artifact Statistics</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground">
            {JSON.stringify(statsData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}