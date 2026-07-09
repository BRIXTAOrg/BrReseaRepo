// app/(dashboard)/redis/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RedisPage() {
  const [infoData, queuesData, containersData] = await Promise.all([
    fetchPythonApi("/prod/redis", { cache: "no-store" }),
    fetchPythonApi("/prod/redis/queues", { cache: "no-store" }),
    fetchPythonApi("/prod/docker/containers", { cache: "no-store" }), // Fetch Docker data
  ]);

  // Safely parse containers and find the one related to Redis
  const containerList = Array.isArray(containersData) ? containersData : containersData?.containers || [];
  const redisContainer = containerList.find((c: any) => 
    (c.name || c.Names?.[0] || "").toLowerCase().includes("redis") ||
    (c.image || c.Image || "").toLowerCase().includes("redis")
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Redis Cache & Broker</h1>
          <p className="text-muted-foreground">Live broker diagnostics and Celery queue statuses.</p>
        </div>
        
        {/* If we found the container, give a quick link to manage it */}
        {redisContainer && (
          <Link href={`/dashboard/docker/${redisContainer.name || redisContainer.Names?.[0]?.replace('/', '')}`}>
            <Button variant="outline">View Container Logs</Button>
          </Link>
        )}
      </div>

      {/* Docker Status Banner */}
      <div className={`p-4 border rounded-xl shadow-sm flex items-center justify-between ${redisContainer ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
        <div>
          <h2 className="font-semibold">{redisContainer ? "Container is Running" : "Container Not Found!"}</h2>
          <p className="text-sm text-muted-foreground">
            {redisContainer ? `ID: ${redisContainer.id || redisContainer.Id?.substring(0,12)} | Status: ${redisContainer.state || redisContainer.Status}` : "Ensure your docker-compose or container is running with 'redis' in the name."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Broker Info</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(infoData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Active Queues</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(queuesData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}