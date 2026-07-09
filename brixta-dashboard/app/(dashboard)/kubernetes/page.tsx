// app/(dashboard)/kubernetes/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";

export default async function KubernetesPage() {
  const [clusterData, podsData, deploymentsData] = await Promise.all([
    fetchPythonApi("/prod/kubernetes", { cache: "no-store" }),
    fetchPythonApi("/prod/kubernetes/pods", { cache: "no-store" }),
    fetchPythonApi("/prod/kubernetes/deployments", { cache: "no-store" }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Kubernetes Cluster</h1>
      <p className="text-muted-foreground">Real-time pod and deployment orchestration data.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Cluster Health</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(clusterData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Pods</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(podsData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Deployments</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(deploymentsData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}