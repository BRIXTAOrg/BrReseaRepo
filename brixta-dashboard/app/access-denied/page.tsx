import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldX />
          </div>
          <CardTitle>Account verified, access not assigned</CardTitle>
          <CardDescription>
            Your identity provider accepted this account, but BRIXTA could not find an allowed tenant membership. Ask a BRIXTA administrator to grant access, or use the account that owns this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/auth/logout" />}>Sign out</Button>
          <Button variant="outline" render={<Link href="/dashboard" />}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
