"""Authentication and tenant context for the BRIXTA MCP gateway."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Any

from fastmcp.server.auth import (
    AccessToken as FastMCPAccessToken,
    JWTVerifier,
    RemoteAuthProvider,
    StaticTokenVerifier,
)
from fastmcp.server.auth.providers.in_memory import InMemoryOAuthProvider
from fastmcp.server.dependencies import get_access_token
from mcp.server.auth.settings import ClientRegistrationOptions
from pydantic import AnyHttpUrl

from core.config import (
    BRIXTA_MCP_AUTH_MODE,
    BRIXTA_MCP_JWKS_URI,
    BRIXTA_MCP_JWT_AUDIENCE,
    BRIXTA_MCP_JWT_ISSUER,
    BRIXTA_MCP_JWT_PUBLIC_KEY,
    BRIXTA_MCP_TENANT_ID,
    BRIXTA_MCP_TOKEN,
)


READ_SCOPE = "brixta:read"
WRITE_SCOPE = "brixta:write"


class BrixtaInMemoryOAuthProvider(InMemoryOAuthProvider):
    """Normalize MCP SDK tokens to FastMCP's token model.

    FastMCP 2.14.x's in-memory provider stores an MCP SDK ``AccessToken``.
    The SDK token permits ``claims=None``, while FastMCP's dependency layer
    requires its own ``AccessToken`` with a dictionary for ``claims``.  The
    mismatch otherwise appears only when a tool calls ``get_access_token``.
    """

    async def verify_token(self, token: str) -> FastMCPAccessToken | None:
        sdk_token = await super().verify_token(token)
        if sdk_token is None:
            return None

        return FastMCPAccessToken(
            token=sdk_token.token,
            client_id=sdk_token.client_id,
            scopes=list(sdk_token.scopes),
            expires_at=sdk_token.expires_at,
            resource=getattr(sdk_token, "resource", None),
            subject=getattr(sdk_token, "subject", None),
            claims=dict(getattr(sdk_token, "claims", None) or {}),
        )


@dataclass(frozen=True)
class AccessContext:
    tenant_id: str
    client_id: str
    scopes: frozenset[str]

    def require(self, scope: str) -> None:
        if scope not in self.scopes:
            raise PermissionError(f"The connection is missing the '{scope}' scope.")


def build_auth_provider() -> Any:
    """Build FastMCP authentication from environment configuration.

    ``oauth-local`` provides an ephemeral OAuth 2.1 development server with
    dynamic client registration. JWT verification is the production
    resource-server mode.
    """
    if BRIXTA_MCP_AUTH_MODE == "none":
        return None

    if BRIXTA_MCP_AUTH_MODE == "oauth-local":
        if not BRIXTA_MCP_TENANT_ID:
            raise RuntimeError("Local OAuth requires BRIXTA_MCP_TENANT_ID.")
        public_url = os.getenv("BRIXTA_MCP_PUBLIC_URL", "").strip()
        if not public_url.startswith("https://"):
            raise RuntimeError("Local OAuth requires the public HTTPS tunnel URL.")
        return BrixtaInMemoryOAuthProvider(
            base_url=public_url.removesuffix("/mcp"),
            client_registration_options=ClientRegistrationOptions(
                enabled=True,
                valid_scopes=[READ_SCOPE, WRITE_SCOPE],
                default_scopes=[READ_SCOPE, WRITE_SCOPE],
            ),
            required_scopes=[READ_SCOPE],
        )

    if BRIXTA_MCP_AUTH_MODE == "static":
        if not BRIXTA_MCP_TOKEN or not BRIXTA_MCP_TENANT_ID:
            raise RuntimeError(
                "Static MCP authentication requires BRIXTA_MCP_TOKEN and "
                "BRIXTA_MCP_TENANT_ID. Run `brixta connect chatgpt --local` "
                "to generate them."
            )
        return StaticTokenVerifier(
            tokens={
                BRIXTA_MCP_TOKEN: {
                    "client_id": "brixta-local",
                    "scopes": [READ_SCOPE, WRITE_SCOPE],
                    "tenant_id": BRIXTA_MCP_TENANT_ID,
                }
            },
            required_scopes=[READ_SCOPE],
        )

    if BRIXTA_MCP_AUTH_MODE == "jwt":
        if not BRIXTA_MCP_JWKS_URI and not BRIXTA_MCP_JWT_PUBLIC_KEY:
            raise RuntimeError(
                "JWT MCP authentication requires BRIXTA_MCP_JWKS_URI or "
                "BRIXTA_MCP_JWT_PUBLIC_KEY."
            )
        kwargs: dict[str, Any] = {
            "required_scopes": [READ_SCOPE],
            "algorithm": os.getenv("BRIXTA_MCP_JWT_ALGORITHM", "RS256"),
        }
        if BRIXTA_MCP_JWKS_URI:
            kwargs["jwks_uri"] = BRIXTA_MCP_JWKS_URI
        else:
            kwargs["public_key"] = BRIXTA_MCP_JWT_PUBLIC_KEY
        if BRIXTA_MCP_JWT_ISSUER:
            kwargs["issuer"] = BRIXTA_MCP_JWT_ISSUER
        if BRIXTA_MCP_JWT_AUDIENCE:
            kwargs["audience"] = BRIXTA_MCP_JWT_AUDIENCE
        verifier = JWTVerifier(**kwargs)
        public_url = os.getenv("BRIXTA_MCP_PUBLIC_URL", "")
        if not BRIXTA_MCP_JWT_ISSUER or not public_url.startswith("https://"):
            raise RuntimeError(
                "Production JWT mode requires BRIXTA_MCP_JWT_ISSUER and an HTTPS "
                "BRIXTA_MCP_PUBLIC_URL so clients can discover OAuth metadata."
            )
        issuer_url = AnyHttpUrl(BRIXTA_MCP_JWT_ISSUER)
        return RemoteAuthProvider(
            token_verifier=verifier,
            authorization_servers=[issuer_url],
            base_url=public_url.removesuffix("/mcp"),
            resource_name="BRIXTA Knowledge Gateway",
        )

    raise RuntimeError(
        "BRIXTA_MCP_AUTH_MODE must be one of: oauth-local, static, jwt, none."
    )


def current_access_context() -> AccessContext:
    """Resolve tenant identity from the verified token, never tool arguments."""
    access_token = get_access_token()
    if access_token is None:
        if BRIXTA_MCP_AUTH_MODE != "none" or not BRIXTA_MCP_TENANT_ID:
            raise PermissionError("An authenticated BRIXTA connection is required.")
        return AccessContext(
            tenant_id=BRIXTA_MCP_TENANT_ID,
            client_id="brixta-stdio",
            scopes=frozenset({READ_SCOPE, WRITE_SCOPE}),
        )

    claims = access_token.claims or {}
    claim_name = os.getenv("BRIXTA_MCP_TENANT_CLAIM", "tenant_id")
    tenant_id = str(claims.get(claim_name) or "").strip()
    if not tenant_id and BRIXTA_MCP_AUTH_MODE == "oauth-local":
        tenant_id = BRIXTA_MCP_TENANT_ID
    if not tenant_id:
        raise PermissionError(
            f"The authenticated token does not contain the '{claim_name}' tenant claim."
        )
    return AccessContext(
        tenant_id=tenant_id,
        client_id=access_token.client_id,
        scopes=frozenset(access_token.scopes),
    )