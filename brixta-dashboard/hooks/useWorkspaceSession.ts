"use client";

import { useEffect, useState } from "react";

export interface TenantMembership {
  tenant_id: string;
  name: string;
  role: string;
  is_default: boolean;
  created_at: string;
}

export interface WorkspaceAuthorization {
  subject: string;
  email: string;
  tenant_id: string;
  roles: string[];
  is_admin: boolean;
  authenticated: boolean;
  memberships: TenantMembership[];
}

export interface WorkspaceSession {
  authenticated: boolean;
  authMode: string;
  user: { name: string; email: string; picture?: string } | null;
  authorization: WorkspaceAuthorization | null;
}

export function useWorkspaceSession() {
  const [session, setSession] = useState<WorkspaceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Session endpoint returned ${response.status}.`);
        return response.json() as Promise<WorkspaceSession>;
      })
      .then((value) => {
        if (!cancelled) setSession(value);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load the workspace session.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return {
    session,
    loading,
    error,
    authorization: session?.authorization || null,
    tenantId: session?.authorization?.tenant_id || "",
    memberships: session?.authorization?.memberships || [],
    isAdmin: Boolean(session?.authorization?.is_admin),
  };
}
