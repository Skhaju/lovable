import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { Key, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/license")({ component: LicensePage });

function LicensePage() {
  return (
    <PageShell title="License">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Activate License</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Client Name" v="Adapt Restaurant Pvt Ltd" />
            <F label="Restaurant Name" v="Adapt Restaurant" />
            <div className="sm:col-span-2"><F label="License Key" v="APOS-9X4F-2K7L-PQ81-A2BC" /></div>
            <F label="System ID" v="SYS-9F2A11B4" readOnly />
            <F label="Expiry Date" v="2027-05-18" />
          </div>
          <div className="mt-5 flex gap-3">
            <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Activate</button>
            <button className="rounded-lg border px-5 py-2 text-sm font-semibold">Deactivate</button>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">License Status</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xl font-bold">Active</span>
            <Badge tone="green">Verified</Badge>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <LRow l="Plan" v="Restaurant Pro" />
            <LRow l="Issued" v="2026-05-18" />
            <LRow l="Expires in" v="365 days" />
            <LRow l="Devices" v="1 / 1" />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Key className="h-3.5 w-3.5" /> Renew 30 days before expiry to avoid downtime.
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function F({ label, v, readOnly }: { label: string; v: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input readOnly={readOnly} defaultValue={v} className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${readOnly ? "text-muted-foreground" : ""}`} />
    </div>
  );
}

function LRow({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}