// app/(dashboard)/layout.tsx

import { ReactNode } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { redirect } from "next/navigation";
import { auth0, auth0Enabled } from "@/lib/auth0";
import { fetchPythonApiServer } from "@/lib/server-api";

// Every dashboard route is user/tenant scoped. Never prerender API data into
// a production image where it could become stale or cross an auth boundary.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (auth0Enabled && auth0) {
    if (!(await auth0.getSession())) {
      redirect("/login");
    }
    const authorization = await fetchPythonApiServer("/auth/me");
    if (authorization.status === 401) {
      redirect("/login");
    }
    if (authorization.status === 403) {
      redirect("/access-denied");
    }
  }
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
