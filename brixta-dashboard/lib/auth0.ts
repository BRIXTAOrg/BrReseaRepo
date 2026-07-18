import { Auth0Client } from "@auth0/nextjs-auth0/server";

export type DashboardAuthMode = "none" | "auth0" | "cloudflare-access";

const configuredMode = (process.env.BRIXTA_DASHBOARD_AUTH_MODE || "none").toLowerCase();

if (!["none", "auth0", "cloudflare-access"].includes(configuredMode)) {
  throw new Error("BRIXTA_DASHBOARD_AUTH_MODE must be none, auth0, or cloudflare-access.");
}

export const dashboardAuthMode = configuredMode as DashboardAuthMode;
export const auth0Enabled = dashboardAuthMode === "auth0";

function requireAuth0Configuration() {
  const required = [
    "AUTH0_DOMAIN",
    "AUTH0_CLIENT_ID",
    "AUTH0_CLIENT_SECRET",
    "AUTH0_SECRET",
    "APP_BASE_URL",
    "AUTH0_AUDIENCE",
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Auth0 dashboard mode is missing: ${missing.join(", ")}`);
  }
}

if (auth0Enabled) {
  requireAuth0Configuration();
}

export const auth0 = auth0Enabled
  ? new Auth0Client({
      authorizationParameters: {
        audience: process.env.AUTH0_AUDIENCE,
        scope: process.env.AUTH0_SCOPE || "openid profile email brixta:read brixta:write",
      },
      signInReturnToPath: "/dashboard",
      enableAccessTokenEndpoint: false,
      session: {
        rolling: true,
        absoluteDuration: 60 * 60 * 12,
        inactivityDuration: 60 * 60 * 2,
      },
    })
  : null;
