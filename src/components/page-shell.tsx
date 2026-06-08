import { TopBar } from "@/components/topbar";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function PageShell({
  title, children, action,
}: { title: string; children: ReactNode; action?: { label: string; onClick?: () => void } }) {
  return (
    <>
      <TopBar title={title} />
      <div className="p-6 space-y-5">
        {action && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground">Manage and configure</p>
            </div>
            <button
              onClick={action.onClick}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> {action.label}
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}

export function Badge({ tone, children }: { tone: "green" | "blue" | "amber" | "violet" | "rose" | "slate"; children: ReactNode }) {
  const map = {
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}