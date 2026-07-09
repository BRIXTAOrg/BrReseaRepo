// app/(dashboard)/docker/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DockerPage() {
  const [infoData, containersData] = await Promise.all([
    fetchPythonApi("/prod/docker", { cache: "no-store" }),
    fetchPythonApi("/prod/docker/containers", { cache: "no-store" }),
  ]);

  // Safely extract the container list whether the API returns a direct array 
  // or an object with a 'containers' key.
  const containerList = Array.isArray(containersData) 
    ? containersData 
    : containersData?.containers || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Docker Host</h1>
      <p className="text-muted-foreground">Local container engine status and running instances.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engine Info */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Engine Info</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(infoData, null, 2)}
          </pre>
        </div>

        {/* Interactive Containers List */}
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold">Running Containers</h2>
             <span className="text-xs text-muted-foreground">Select to view logs & controls</span>
          </div>
          
          <div className="flex flex-col gap-3 grow max-h-96 overflow-auto pr-2">
            {containerList.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                No containers found or failed to parse data.
              </div>
            ) : (
              containerList.map((container: any, idx: number) => {
                // Assuming your Python API returns at least a 'name' field for the container
                // Adjust 'container.name' to 'container.Id' or whatever key your API provides if needed.
                const name = container.name || container.Names?.[0]?.replace('/', '') || `container-${idx}`;
                const status = container.state || container.Status || "Unknown";

                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{name}</span>
                      <span className="text-xs text-muted-foreground">Status: {status}</span>
                    </div>
                    
                    <Link href={`/docker/${name}`}>
                      <Button variant="secondary" size="sm">
                        Manage →
                      </Button>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}