// app/(dashboard)/jobs/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";

export default async function JobsPage() {
  // Fetch all Celery and task data in parallel
  const [
    infoData,
    workersData,
    activeData,
    reservedData,
    scheduledData,
    statsData,
  ] = await Promise.all([
    fetchPythonApi("/prod/celery", { cache: "no-store" }),
    fetchPythonApi("/prod/celery/workers", { cache: "no-store" }),
    fetchPythonApi("/prod/celery/tasks/active", { cache: "no-store" }),
    fetchPythonApi("/prod/celery/tasks/reserved", { cache: "no-store" }),
    fetchPythonApi("/prod/celery/tasks/scheduled", { cache: "no-store" }),
    fetchPythonApi("/prod/celery/stats", { cache: "no-store" }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Background Jobs</h1>
      <p className="text-muted-foreground">
        Live Celery worker status and vectorization task queues.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Celery Health</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(infoData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Workers</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(workersData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Active Tasks</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(activeData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Reserved Tasks</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(reservedData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Scheduled Tasks</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(scheduledData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Global Stats</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(statsData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}