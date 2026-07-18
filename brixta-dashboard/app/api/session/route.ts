import { auth0, auth0Enabled, dashboardAuthMode } from "@/lib/auth0";
import { fetchPythonApiServer } from "@/lib/server-api";

export async function GET() {
  if (!auth0Enabled || !auth0) {
    const authorization = await fetchPythonApiServer("/auth/me");
    return Response.json({
      authenticated: dashboardAuthMode !== "auth0",
      authMode: dashboardAuthMode,
      user: dashboardAuthMode === "none"
        ? { name: "Local administrator", email: "local@brixta.invalid" }
        : null,
      authorization: authorization.error ? null : authorization,
    });
  }

  const session = await auth0.getSession();
  const authorization = session
    ? await fetchPythonApiServer("/auth/me")
    : null;
  return Response.json({
    authenticated: Boolean(session),
    authMode: dashboardAuthMode,
    user: session
      ? {
          name: session.user.name || session.user.nickname || session.user.email || "BRIXTA user",
          email: session.user.email || "",
          picture: session.user.picture || "",
        }
      : null,
    authorization:
      authorization && !authorization.error ? authorization : null,
  });
}
