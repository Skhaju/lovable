import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kitchen")({ component: KitchenPage });

type KitchenTicket = {
  id: string;
  table_name: string | null;
  status: string;
  created_at: string;
  order_items: Array<{ name: string; qty: number }>;
};

function KitchenPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["kitchen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,table_name,status,created_at,order_items(name,qty)")
        .in("status", ["pending", "preparing"]) 
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as KitchenTicket[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      qc.invalidateQueries({ queryKey: ["kot"] });
    },
  });

  return (
    <PageShell title="Kitchen Screen">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading && <div className="text-sm text-muted-foreground">Loading kitchen tickets...</div>}
        {!isLoading && data.length === 0 && <div className="text-sm text-muted-foreground">No active kitchen tickets.</div>}
        {data.map((t) => (
          <div key={t.id} className="flex flex-col rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b p-3">
              <div>
                <div className="text-sm font-bold">{t.id}</div>
                <div className="text-xs text-muted-foreground">Table {t.table_name ?? "-"} · {new Date(t.created_at).toLocaleTimeString()}</div>
              </div>
              <Badge tone={t.status === "completed" ? "green" : t.status === "preparing" ? "amber" : "blue"}>{t.status}</Badge>
            </div>
            <div className="flex-1 space-y-2 p-3 text-sm">
              {t.order_items.map((it, k) => (
                <div key={k}>
                  <div className="flex justify-between font-medium">
                    <span>{it.name}</span>
                    <span className="rounded bg-primary/10 px-2 text-primary">×{it.qty}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t p-2">
              <button
                type="button"
                onClick={() => updateStatus.mutate({ id: t.id, status: "preparing" })}
                className="flex-1 rounded-md border py-1.5 text-xs hover:bg-muted"
              >
                Preparing
              </button>
              <button
                type="button"
                onClick={() => updateStatus.mutate({ id: t.id, status: "completed" })}
                className="flex-1 rounded-md bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Complete
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}