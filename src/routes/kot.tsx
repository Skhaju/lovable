import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer, ChefHat } from "lucide-react";

export const Route = createFileRoute("/kot")({ component: KOTPage });

type KotRow = { id: string; table_name: string | null; status: string; created_at: string; order_items: Array<{ name: string; qty: number }> };

function KOTPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["kot"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,table_name,status,created_at,order_items(name,qty)")
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as KotRow[];
    },
  });

  const printTicket = () => window.print();

  return (
    <PageShell title="KOT - Kitchen Order Tickets">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading KOTs...</p>}
          {data.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ChefHat className="h-5 w-5" /></div>
                <div>
                  <div className="font-semibold">{k.id}</div>
                  <div className="text-xs text-muted-foreground">Table {k.table_name ?? "-"} · {k.order_items?.reduce((sum, item) => sum + item.qty, 0) ?? 0} items · {new Date(k.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={k.status === "completed" ? "green" : k.status === "preparing" ? "amber" : "blue"}>{k.status}</Badge>
                <button onClick={printTicket} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"><Printer className="h-3.5 w-3.5" /> Print</button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-white p-5 font-mono text-xs text-black shadow-sm" style={{ maxWidth: 420 }}>
          <div className="border-b border-dashed border-black pb-2 text-center">
            <div className="text-base font-bold">*** KOT ***</div>
            <div>Adapt Restaurant</div>
          </div>
          <div className="my-2 grid grid-cols-2 gap-1">
            <div>KOT No: 201</div>
            <div className="text-right">Table: T-02</div>
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div className="text-right">{new Date().toLocaleTimeString()}</div>
          </div>
          <div className="border-y border-dashed border-black py-2">
            <div className="flex justify-between font-bold"><span>Item</span><span>Qty</span></div>
            {(data[0]?.order_items ?? []).map((it, i) => (
              <div key={i} className="mt-1">
                <div className="flex justify-between"><span>{it.name}</span><span>{it.qty}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">--- Steward: Ravi ---</div>
        </div>
      </div>
    </PageShell>
  );
}
