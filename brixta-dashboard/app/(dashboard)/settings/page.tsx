// app/(dashboard)/settings/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";

export default async function SettingsPage() {
  // Fetch all settings data in parallel
  const [configData, runtimeData, infraData, envData] = await Promise.all([
    fetchPythonApi("/prod/settings", {cache: "no-store"}),
    fetchPythonApi("/settings/runtime", {cache: "no-store"}),
    fetchPythonApi("/settings/infrastructure", {cache: "no-store"}),
    fetchPythonApi("/settings/environment", {cache: "no-store"}),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      <p className="text-muted-foreground">
        Configuration and environment details fetched from Python API.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Configuration */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">General Configuration</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(configData, null, 2)}
          </pre>
        </div>

        {/* Runtime Settings */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Runtime</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(runtimeData, null, 2)}
          </pre>
        </div>

        {/* Infrastructure Settings */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Infrastructure</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(infraData, null, 2)}
          </pre>
        </div>

        {/* Environment Settings */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Environment</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(envData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}