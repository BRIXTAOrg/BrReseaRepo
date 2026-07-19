CREATE TABLE IF NOT EXISTS "BrResearch"."auth_users" (
    "subject" text PRIMARY KEY,
    "email" text,
    "display_name" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "last_seen_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "BrResearch"."tenants" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "BrResearch"."tenant_memberships" (
    "subject" text NOT NULL,
    "tenant_id" text NOT NULL,
    "role" text NOT NULL DEFAULT 'member',
    "is_default" boolean NOT NULL DEFAULT false,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT "tenant_memberships_subject_tenant_pk"
        PRIMARY KEY ("subject", "tenant_id"),

    CONSTRAINT "tenant_memberships_subject_auth_users_fk"
        FOREIGN KEY ("subject")
        REFERENCES "BrResearch"."auth_users" ("subject")
        ON DELETE CASCADE,

    CONSTRAINT "tenant_memberships_tenant_id_tenants_fk"
        FOREIGN KEY ("tenant_id")
        REFERENCES "BrResearch"."tenants" ("id")
        ON DELETE CASCADE,

    CONSTRAINT "tenant_memberships_role_check"
        CHECK ("role" IN ('viewer', 'member', 'operator', 'admin', 'owner'))
);

CREATE INDEX IF NOT EXISTS "tenant_memberships_tenant_idx"
    ON "BrResearch"."tenant_memberships" ("tenant_id");

CREATE INDEX IF NOT EXISTS "tenant_memberships_subject_idx"
    ON "BrResearch"."tenant_memberships" ("subject");

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_memberships_one_default_idx"
    ON "BrResearch"."tenant_memberships" ("subject")
    WHERE "is_default" = true;
