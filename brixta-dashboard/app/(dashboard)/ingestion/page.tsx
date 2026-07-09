// app/(dashboard)/ingestion/page.tsx

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function IngestionPage() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build the URL with the required query parameters for FastAPI
      // Assuming localhost:8000 as per your current environment setup
      const targetUrl = new URL("http://localhost:8000/ingest");
      targetUrl.searchParams.append("source_url", sourceUrl);
      targetUrl.searchParams.append("tenant_id", tenantId);

      // Trigger the POST request directly to the backend
      const res = await fetch(targetUrl.toString(), {
        method: "POST",
      });

      if (!res.ok) {
        // Attempt to parse FastAPI's detailed error message if it exists
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Ingestion failed: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
      
      // Clear the form on successful submission
      setSourceUrl("");
      setTenantId("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred connecting to the API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Ingestion</h1>
        <p className="text-muted-foreground">
          Trigger a new vectorization pipeline task.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Column */}
        <div className="p-6 border rounded-xl shadow-sm bg-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                type="url"
                placeholder="https://example.com/document.pdf"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be a valid HTTP/HTTPS URL.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                type="text"
                placeholder="tenant_abcd1234"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Queuing Job..." : "Start Ingestion"}
            </Button>
          </form>
        </div>

        {/* Results/Feedback Column */}
        <div className="p-6 border rounded-xl shadow-sm bg-card flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Submission Result</h2>
          
          <div className="grow bg-muted p-4 rounded-md overflow-auto border border-border/50 flex flex-col justify-center">
            {!result && !error && (
              <span className="text-sm text-muted-foreground text-center">
                Fill out the form to trigger a job.
              </span>
            )}
            
            {error && (
              <div className="text-sm text-red-500 font-mono wrap-break-word">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {result && (
              <div className="space-y-2">
                <span className="text-sm text-green-500 font-bold">
                  ✓ {result.message}
                </span>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono mt-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}