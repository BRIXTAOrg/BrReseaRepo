import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth0, auth0Enabled, dashboardAuthMode } from "@/lib/auth0";

// Authentication is configured when the container starts. Rendering this page
// at build time would permanently bake the CI environment's auth mode into the
// production image.
export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (auth0Enabled && auth0 && (await auth0.getSession())) {
    redirect("/dashboard");
  }
  const { error } = (await searchParams) ?? {};
  const protectedDashboard = dashboardAuthMode !== "none";
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_42%)] p-6">
      <Card className="w-full max-w-md border-border/70 bg-background/90 shadow-2xl backdrop-blur-xl">
        <CardHeader>
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LockKeyhole className="size-6" />
          </div>
          <CardTitle className="text-2xl">Sign in to BRIXTA</CardTitle>
          <CardDescription>
            {auth0Enabled
              ? "Use your BRIXTA account. Your session stays in an encrypted, HTTP-only cookie and API tokens remain on the server."
              : protectedDashboard
                ? "Continue through the configured identity gateway."
                : "Local development mode is active; no external sign-in is required."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Sign-in could not be completed. Check the Auth0 application callback, audience, scopes, and enabled database connection, then try again.
            </div>
          ) : null}

          {auth0Enabled ? (
            <div className="grid gap-3">
              <Button
                nativeButton={false}
                render={<a href="/auth/login?returnTo=/dashboard" />}
                className="w-full"
              >
                Sign in <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                nativeButton={false}
                render={<a href="/auth/login?screen_hint=signup&returnTo=/dashboard" />}
                variant="outline"
                className="w-full"
              >
                <Sparkles data-icon="inline-start" /> Create a BRIXTA workspace
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                First sign-in creates your private BRIXTA workspace automatically.
              </p>
            </div>
          ) : (
            <Button
              nativeButton={false}
              render={<a href="/dashboard" />}
              className="w-full"
            >
              Enter local dashboard
            </Button>
          )}
          <div className="flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Tenant membership and roles are enforced by BRIXTA PostgreSQL after identity verification.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
