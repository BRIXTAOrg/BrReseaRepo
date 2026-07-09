// app/(dashboard)/docker/[name]/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";
import { RestartButton } from "./RestartButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ContainerDetailsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  // Await the params object in Next.js 15+ 
  const { name } = await params;

  // Fetch specific container info and logs in parallel
  const [containerData, logsData] = await Promise.all([
    fetchPythonApi(`/prod/docker/container/${name}`, { cache: "no-store" }),
    fetchPythonApi(`/prod/docker/logs/${name}?tail=200`, { cache: "no-store" }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/docker">
              <Button variant="outline" size="sm">
                ← Back to Host
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              {name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Live inspection and recent logs.
          </p>
        </div>
        
        {/* Render our interactive Client Component */}
        <RestartButton containerName={name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Container Details Column */}
        <div className="lg:col-span-1 p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Details</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-150">
            {JSON.stringify(containerData, null, 2)}
          </pre>
        </div>

        {/* Container Logs Column */}
        <div className="lg:col-span-2 p-4 border rounded-xl shadow-sm bg-black flex flex-col">
          <div className="flex justify-between items-center mb-2 text-white">
            <h2 className="text-lg font-semibold">Terminal Logs</h2>
            <span className="text-xs text-gray-400">Tailing last 200 lines</span>
          </div>
          <pre className="p-4 rounded-md text-xs font-mono overflow-auto text-green-400 grow max-h-150">
            {/* If your Python logs endpoint returns a raw string, render it directly. 
                If it returns JSON, stringify it like below: */}
            {typeof logsData === 'string' ? logsData : JSON.stringify(logsData, null, 2)}
          </pre>
        </div>
        
      </div>
    </div>
  );
}