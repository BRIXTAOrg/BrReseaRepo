// app/(dashboard)/plugins/page.tsx

import React from "react";
import { fetchPythonApi } from "@/lib/api";

export default async function PluginsPage() {
  const [embeddingData, downloaderData, chunkerData] = await Promise.all([
    fetchPythonApi("/prod/plugins/embedding", { cache: "no-store" }),
    fetchPythonApi("/prod/plugins/downloader", { cache: "no-store" }),
    fetchPythonApi("/prod/plugins/chunker", { cache: "no-store" }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">System Plugins</h1>
      <p className="text-muted-foreground">
        Active handlers for downloading, chunking, and embedding data.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Embedding Models</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(embeddingData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Downloaders</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(downloaderData, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Chunkers</h2>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto text-muted-foreground grow max-h-96">
            {JSON.stringify(chunkerData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}