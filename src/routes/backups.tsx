import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { backups } from "@/lib/mock-data";
import { Database, Download, Upload, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/backups")({ component: BackupsPage });

function BackupsPage() {
  return (
    <PageShell title="Backups">
      <div className="grid gap-4 md:grid-cols-3">
        <Card icon={Database} label="Take Manual Backup" desc="Export current database as .sql" cta="Backup Now" />
        <Card icon={Upload} label="Restore Backup" desc="Restore from a .sql file" cta="Choose File" />
        <Card icon={RotateCcw} label="Auto Backup" desc="Daily at 11:00 PM" cta="Enabled" muted />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-3 text-sm font-semibold">Backup History</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3 font-medium">{b.file}</td>
                <td className="px-4 py-3">{b.size}</td>
                <td className="px-4 py-3"><Badge tone={b.type === "Manual" ? "blue" : "violet"}>{b.type}</Badge></td>
                <td className="px-4 py-3 text-muted-foreground">{b.date}</td>
                <td className="px-4 py-3 text-right">
                  <button className="mr-2 inline-flex items-center gap-1 text-primary hover:underline">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button className="text-rose-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function Card({ icon: Icon, label, desc, cta, muted }: { icon: typeof Database; label: string; desc: string; cta: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
      <button className={`mt-4 w-full rounded-lg py-2 text-sm font-semibold ${muted ? "bg-emerald-100 text-emerald-700" : "bg-primary text-primary-foreground"}`}>
        {cta}
      </button>
    </div>
  );
}