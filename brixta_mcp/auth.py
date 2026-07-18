"""Authentication and tenant context for the BRIXTA MCP gateway."""

from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Any
from urllib.parse import unquote, urlparse

from fastmcp.server.auth import (
    AccessToken as FastMCPAccessToken,
    JWTVerifier,
    RemoteAuthProvider,
    StaticTokenVerifier,
)
from fastmcp.server.auth.providers.auth0 import Auth0Provider
from fastmcp.server.auth.providers.in_memory import InMemoryOAuthProvider
from fastmcp.server.dependencies import get_access_token
from mcp.server.auth.settings import ClientRegistrationOptions
from pydantic import AnyHttpUrl

from core.config import (
    BRIXTA_MCP_AUTH_MODE,
    BRIXTA_MCP_AUTH0_AUDIENCE,
    BRIXTA_MCP_AUTH0_CLIENT_ID,
    BRIXTA_MCP_AUTH0_CLIENT_SECRET,
    BRIXTA_MCP_AUTH0_CONFIG_URL,
    BRIXTA_MCP_AUTHORIZATION_BACKEND,
    BRIXTA_MCP_JWKS_URI,
    BRIXTA_MCP_JWT_AUDIENCE,
    BRIXTA_MCP_JWT_ISSUER,
    BRIXTA_MCP_JWT_PUBLIC_KEY,
    BRIXTA_MCP_OAUTH_SIGNING_KEY,
    BRIXTA_MCP_OAUTH_STORAGE_KEY,
    BRIXTA_MCP_TENANT_ID,
    BRIXTA_MCP_TOKEN,
    REDIS_URL,
)
from runtime.auth import IdentityAccessRepository


READ_SCOPE = "brixta:read"
WRITE_SCOPE = "brixta:write"


def _oauth_client_storage() -> Any:
    """Create encrypted Redis storage for OAuth registrations and tokens."""
    if not BRIXTA_MCP_OAUTH_STORAGE_KEY:
        raise RuntimeError("Auth0 MCP mode requires BRIXTA_MCP_OAUTH_STORAGE_KEY.")
    parsed = urlparse(REDIS_URL)
    if parsed.scheme not in {"redis", "rediss"} or not parsed.hostname:
        raise RuntimeError("Auth0 MCP mode requires a valid REDIS_URL.")

    from cryptography.fernet import Fernet
    from key_value.aio.stores.redis import RedisStore
    from key_value.aio.wrappers.encryption import FernetEncryptionWrapper

    store = RedisStore(
        host=parsed.hostname,
        port=parsed.port or 6379,
        password=unquote(parsed.password) if parsed.password else None,
    )
    return FernetEncryptionWrapper(
        key_value=store,
        fernet=Fernet(BRIXTA_MCP_OAUTH_STORAGE_KEY.encode("ascii")),
    )


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
    tenant_ids: frozenset[str] = frozenset()
    tenant_roles: dict[str, str] | None = None

    def require(self, scope: str) -> None:
        if scope not in self.scopes:
            raise PermissionError(f"The connection is missing the '{scope}' scope.")

    def tenant_for(self, requested: str | None = None, *, write: bool = False) -> str:
        """Select one tenant without trusting a tool argument on its own."""
        candidate = (requested or "").strip() or self.tenant_id
        allowed = self.tenant_ids or frozenset({self.tenant_id})
        if candidate not in allowed:
            raise PermissionError("The requested tenant is outside this connection's memberships.")
        if write:
            self.require(WRITE_SCOPE)
            if self.tenant_roles is not None:
                role = self.tenant_roles.get(candidate, "")
                if role not in {"member", "operator", "admin", "owner", "brixta-admin"}:
                    raise PermissionError("A write-capable tenant role is required.")
        return candidate

    def accessible_tenants(self, requested: str | None = None) -> tuple[str, ...]:
        if requested:
            return (self.tenant_for(requested),)
        return tuple(sorted(self.tenant_ids or frozenset({self.tenant_id})))


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
            required_scopes=[READ_SCOPE, WRITE_SCOPE],
        )

    if BRIXTA_MCP_AUTH_MODE == "auth0":
        public_url = os.getenv("BRIXTA_MCP_PUBLIC_URL", "").strip()
        missing = [
            name
            for name, value in (
                ("BRIXTA_MCP_AUTH0_CONFIG_URL", BRIXTA_MCP_AUTH0_CONFIG_URL),
                ("BRIXTA_MCP_AUTH0_CLIENT_ID", BRIXTA_MCP_AUTH0_CLIENT_ID),
                ("BRIXTA_MCP_AUTH0_CLIENT_SECRET", BRIXTA_MCP_AUTH0_CLIENT_SECRET),
                ("BRIXTA_MCP_AUTH0_AUDIENCE", BRIXTA_MCP_AUTH0_AUDIENCE),
                ("BRIXTA_MCP_OAUTH_SIGNING_KEY", BRIXTA_MCP_OAUTH_SIGNING_KEY),
                ("BRIXTA_MCP_OAUTH_STORAGE_KEY", BRIXTA_MCP_OAUTH_STORAGE_KEY),
            )
            if not value
        ]
        if missing:
            raise RuntimeError("Auth0 MCP mode is missing: " + ", ".join(missing))
        if not public_url.startswith("https://"):
            raise RuntimeError("Auth0 MCP mode requires an HTTPS BRIXTA_MCP_PUBLIC_URL.")
        return Auth0Provider(
            config_url=BRIXTA_MCP_AUTH0_CONFIG_URL,
            client_id=BRIXTA_MCP_AUTH0_CLIENT_ID,
            client_secret=BRIXTA_MCP_AUTH0_CLIENT_SECRET,
            audience=BRIXTA_MCP_AUTH0_AUDIENCE,
            base_url=public_url.removesuffix("/mcp"),
            required_scopes=[READ_SCOPE, WRITE_SCOPE],
            jwt_signing_key=BRIXTA_MCP_OAUTH_SIGNING_KEY,
            client_storage=_oauth_client_storage(),
            require_authorization_consent=True,
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
        "BRIXTA_MCP_AUTH_MODE must be one of: auth0, oauth-local, static, jwt, none."
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
            tenant_ids=frozenset({BRIXTA_MCP_TENANT_ID}),
        )

    claims = access_token.claims or {}
    if (
        BRIXTA_MCP_AUTHORIZATION_BACKEND == "postgres"
        and BRIXTA_MCP_AUTH_MODE in {"auth0", "jwt"}
    ):
        subject = str(
            getattr(access_token, "subject", "")
            or claims.get("sub")
            or ""
        ).strip()
        email_claim = os.getenv("BRIXTA_AUTH_EMAIL_CLAIM", "email")
        try:
            identity = IdentityAccessRepository.resolve(
                subject=subject,
                email=str(claims.get(email_claim) or ""),
            )
        except PermissionError as exc:
            raise PermissionError(str(exc)) from exc
        return AccessContext(
            tenant_id=identity.tenant_id,
            client_id=access_token.client_id,
            scopes=frozenset(access_token.scopes),
            tenant_ids=identity.tenant_ids,
            tenant_roles=identity.tenant_roles,
        )
    if BRIXTA_MCP_AUTHORIZATION_BACKEND not in {"claims", "postgres"}:
        raise RuntimeError("BRIXTA_MCP_AUTHORIZATION_BACKEND must be 'claims' or 'postgres'.")
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
        tenant_ids=frozenset({tenant_id}),
    )
