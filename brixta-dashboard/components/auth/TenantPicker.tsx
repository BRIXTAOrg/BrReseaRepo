"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantMembership } from "@/hooks/useWorkspaceSession";

interface TenantPickerProps {
  id: string;
  value: string;
  memberships: TenantMembership[];
  loading?: boolean;
  onChange: (tenantId: string) => void;
}

export default function TenantPicker({ id, value, memberships, loading = false, onChange }: TenantPickerProps) {
  if (memberships.length > 1) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Workspace</Label>
        <select id={id} className="h-9 w-full rounded-xl border bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)} disabled={loading} required>
          {memberships.map((membership) => (
            <option key={membership.tenant_id} value={membership.tenant_id}>
              {membership.name || membership.tenant_id} · {membership.role}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const membership = memberships[0];
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Workspace</Label>
      <Input id={id} value={loading ? "Loading authenticated workspace…" : (membership?.name || value)} readOnly disabled={loading} />
      {!loading && membership ? <p className="text-xs text-muted-foreground">Authenticated as {membership.role} · {membership.tenant_id}</p> : null}
    </div>
  );
}
