import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

type Order = {
  id: string;
  code: string;
  table_name: string | null;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
};

function OrdersPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,code,table_name,total,status,created_at,order_items(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((order: any) => ({
        id: order.id,
        code: order.code,
        table_name: order.table_name,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        items_count: Array.isArray(order.order_items) ? order.order_items.length : 0,
      })) as Order[];
    },
  });

  return (
    <PageShell title="Orders">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Table</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading orders...</td></tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No orders found</td></tr>
            )}
            {data.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-medium">{o.code}</td>
                <td className="px-4 py-3">{o.table_name ?? "-"}</td>
                <td className="px-4 py-3">{o.items_count}</td>
                <td className="px-4 py-3 font-semibold">₹{o.total}</td>
                <td className="px-4 py-3">
                  <Badge tone={o.status === "paid" ? "green" : o.status === "pending" ? "amber" : "blue"}>{o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
