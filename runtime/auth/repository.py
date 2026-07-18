"""Free, provider-neutral tenant membership storage.

The identity provider proves who the caller is. BRIXTA owns authorization in
PostgreSQL so hosted deployments do not require paid Auth0 Organizations/RBAC
and self-hosters can replace Auth0 without rewriting the data model.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from typing import Any

from core.config import (
    BRIXTA_ADMIN_EMAILS,
    BRIXTA_ADMIN_SUBJECTS,
    BRIXTA_BOOTSTRAP_TENANT_ID,
    BRIXTA_SIGNUP_MODE,
)
from core.database import get_connection


@dataclass(frozen=True)
class IdentityResolution:
    subject: str
    email: str
    tenant_id: str
    roles: frozenset[str]
    tenant_ids: frozenset[str]
    tenant_roles: dict[str, str]


class IdentityAccessRepository:
    """Resolve a verified OIDC subject to BRIXTA-owned memberships."""

    @staticmethod
    def _personal_tenant(subject: str) -> str:
        digest = sha256(subject.encode("utf-8")).hexdigest()[:20]
        return f"personal-{digest}"

    @classmethod
    def resolve(
        cls,
        *,
        subject: str,
        email: str = "",
        requested_tenant: str | None = None,
    ) -> IdentityResolution:
        if not subject:
            raise PermissionError("The verified token has no subject.")

        normalized_email = email.strip().lower()
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO "BrResearch".auth_users
                        (subject, email, last_seen_at)
                    VALUES (%s, NULLIF(%s, ''), now())
                    ON CONFLICT (subject) DO UPDATE
                    SET email = COALESCE(NULLIF(EXCLUDED.email, ''), auth_users.email),
                        last_seen_at = now()
                    """,
                    (subject, normalized_email),
                )
                cursor.execute(
                    """
                    SELECT tenant_id, role, is_default
                    FROM "BrResearch".tenant_memberships
                    WHERE subject = %s
                    ORDER BY is_default DESC, created_at ASC
                    """,
                    (subject,),
                )
                rows = cursor.fetchall()

                if not rows:
                    tenant_id, role = cls._initial_membership(subject, normalized_email)
                    cursor.execute(
                        """
                        INSERT INTO "BrResearch".tenants (id, name)
                        VALUES (%s, %s)
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (tenant_id, tenant_id),
                    )
                    cursor.execute(
                        """
                        INSERT INTO "BrResearch".tenant_memberships
                            (subject, tenant_id, role, is_default)
                        VALUES (%s, %s, %s, true)
                        ON CONFLICT (subject, tenant_id) DO NOTHING
                        """,
                        (subject, tenant_id, role),
                    )
                    rows = [(tenant_id, role, True)]

        memberships = {str(row[0]): str(row[1]) for row in rows}
        selected = (requested_tenant or "").strip()
        if selected and selected not in memberships:
            raise PermissionError("The requested tenant is outside the authenticated memberships.")
        if not selected:
            selected = str(next((row[0] for row in rows if row[2]), rows[0][0]))

        return IdentityResolution(
            subject=subject,
            email=normalized_email,
            tenant_id=selected,
            roles=frozenset({memberships[selected]}),
            tenant_ids=frozenset(memberships),
            tenant_roles=memberships,
        )

    @staticmethod
    def _initial_membership(subject: str, email: str) -> tuple[str, str]:
        if (
            subject in BRIXTA_ADMIN_SUBJECTS
            or (email and email in BRIXTA_ADMIN_EMAILS)
        ) and BRIXTA_BOOTSTRAP_TENANT_ID:
            return BRIXTA_BOOTSTRAP_TENANT_ID, "admin"
        if BRIXTA_SIGNUP_MODE == "personal":
            return IdentityAccessRepository._personal_tenant(subject), "owner"
        if BRIXTA_SIGNUP_MODE == "closed":
            raise PermissionError(
                "This account has no BRIXTA tenant membership. Ask an administrator for access."
            )
        raise RuntimeError("BRIXTA_SIGNUP_MODE must be 'closed' or 'personal'.")

    @staticmethod
    def memberships(subject: str) -> list[dict[str, Any]]:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT m.tenant_id, t.name, m.role, m.is_default, m.created_at
                    FROM "BrResearch".tenant_memberships m
                    JOIN "BrResearch".tenants t ON t.id = m.tenant_id
                    WHERE m.subject = %s
                    ORDER BY m.is_default DESC, m.created_at ASC
                    """,
                    (subject,),
                )
                rows = cursor.fetchall()
        return [
            {
                "tenant_id": str(row[0]),
                "name": row[1],
                "role": row[2],
                "is_default": bool(row[3]),
                "created_at": row[4].isoformat(),
            }
            for row in rows
        ]

    @staticmethod
    def grant(*, subject: str, tenant_id: str, role: str, make_default: bool = False) -> None:
        if role not in {"viewer", "member", "operator", "admin", "owner"}:
            raise ValueError("Unsupported tenant role.")
        with get_connection() as conn:
            with conn.cursor() as cursor:
                # Closed-signup deployments grant access before the person's
                # first login, so the external subject may not exist locally.
                cursor.execute(
                    """
                    INSERT INTO "BrResearch".auth_users (subject, last_seen_at)
                    VALUES (%s, now())
                    ON CONFLICT (subject) DO NOTHING
                    """,
                    (subject,),
                )
                if make_default:
                    cursor.execute(
                        'UPDATE "BrResearch".tenant_memberships SET is_default = false WHERE subject = %s',
                        (subject,),
                    )
                cursor.execute(
                    """
                    INSERT INTO "BrResearch".tenants (id, name)
                    VALUES (%s, %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (tenant_id, tenant_id),
                )
                cursor.execute(
                    """
                    INSERT INTO "BrResearch".tenant_memberships
                        (subject, tenant_id, role, is_default)
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s OR NOT EXISTS (
                            SELECT 1
                            FROM "BrResearch".tenant_memberships
                            WHERE subject = %s
                        )
                    )
                    ON CONFLICT (subject, tenant_id) DO UPDATE
                    SET role = EXCLUDED.role,
                        is_default = CASE
                            WHEN EXCLUDED.is_default THEN true
                            ELSE tenant_memberships.is_default
                        END
                    """,
                    (subject, tenant_id, role, make_default, subject),
                )

    @staticmethod
    def revoke(*, subject: str, tenant_id: str) -> bool:
        """Remove one membership without deleting the external identity."""
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM "BrResearch".tenant_memberships
                    WHERE subject = %s AND tenant_id = %s
                    """,
                    (subject, tenant_id),
                )
                removed = cursor.rowcount > 0
                if removed:
                    cursor.execute(
                        """
                        WITH first_membership AS (
                            SELECT tenant_id
                            FROM "BrResearch".tenant_memberships
                            WHERE subject = %s
                            ORDER BY created_at ASC
                            LIMIT 1
                        )
                        UPDATE "BrResearch".tenant_memberships
                        SET is_default = true
                        WHERE subject = %s
                          AND tenant_id = (SELECT tenant_id FROM first_membership)
                          AND NOT EXISTS (
                              SELECT 1
                              FROM "BrResearch".tenant_memberships
                              WHERE subject = %s AND is_default = true
                          )
                        """,
                        (subject, subject, subject),
                    )
        return removed
