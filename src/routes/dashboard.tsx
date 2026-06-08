import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/topbar";
import { PageShell, Badge } from "@/components/page-shell";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

type OrderRow = { id: string; code: string; table_name: string | null; total: number; status: string; created_at: string; order_items: { id: string }[] };
type ItemSale = { name: string; qty: number; revenue: number };

function Dashboard() {
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["dashboard", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,code,table_name,total,status,created_at,order_items(id)")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const { data: itemRows = [], isLoading: loadingItems } = useQuery({
    queryKey: ["dashboard", "itemSales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("name,qty,price");
      if (error) throw error;
      return (data ?? []) as Array<{ name: string; qty: number; price: number }>;
    },
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["dashboard", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("amount,mode,status");
      if (error) throw error;
      return (data ?? []) as Array<{ amount: number; mode: string; status: string }>;
    },
  });

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    const pending = orders.filter((order) => order.status.toLowerCase() === "pending").length;
    const cash = payments.filter((p) => p.mode.toLowerCase() === "cash").reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const upi = payments.filter((p) => p.mode.toLowerCase() === "upi").reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const card = payments.filter((p) => p.mode.toLowerCase() === "card").reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const totals = [{ label: "Today Sales", value: `₹ ${totalSales.toLocaleString()}`, delta: "+0.0%", icon: "IndianRupee", color: "bg-blue-500" },
      { label: "Total Orders", value: `${orders.length}`, delta: "+0.0%", icon: "ShoppingBag", color: "bg-indigo-500" },
      { label: "Pending Bills", value: `${pending}`, delta: "-0.0%", icon: "Clock", color: "bg-amber-500" },
      { label: "Cash Collection", value: `₹ ${cash.toLocaleString()}`, delta: "+0.0%", icon: "Wallet", color: "bg-emerald-500" },
      { label: "UPI Collection", value: `₹ ${upi.toLocaleString()}`, delta: "+0.0%", icon: "Smartphone", color: "bg-violet-500" },
      { label: "Card Collection", value: `₹ ${card.toLocaleString()}`, delta: "+0.0%", icon: "CreditCard", color: "bg-rose-500" }];
    return totals;
  }, [orders, payments]);

  const topItems = useMemo(() => {
    const summary: Record<string, ItemSale> = {};
    itemRows.forEach((row) => {
      if (!row.name) return;
      summary[row.name] ??= { name: row.name, qty: 0, revenue: 0 };
      summary[row.name].qty += Number(row.qty ?? 0);
      summary[row.name].revenue += Number(row.price ?? 0) * Number(row.qty ?? 0);
    });
    return Object.values(summary).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [itemRows]);

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color} text-white`}>
                  <span className="text-xs font-semibold">{s.label.charAt(0)}</span>
                </div>
                <span className="text-xs font-medium text-emerald-600">{s.delta}</span>
              </div>
              <div className="mt-3 text-2xl font-bold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Orders</h2>
              <button className="text-xs text-primary hover:underline">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 font-medium">Order</th>
                    <th className="py-2 font-medium">Table</th>
                    <th className="py-2 font-medium">Items</th>
                    <th className="py-2 font-medium">Total</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(loadingOrders || loadingPayments) && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading orders...</td></tr>
                  )}
                  {!loadingOrders && orders.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No orders found</td></tr>
                  )}
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="py-2.5 font-medium">{o.code}</td>
                      <td className="py-2.5">{o.table_name ?? "-"}</td>
                      <td className="py-2.5">{o.order_items?.length ?? 0}</td>
                      <td className="py-2.5 font-semibold">₹{o.total}</td>
                      <td className="py-2.5"><Badge tone={o.status === "paid" ? "green" : o.status === "pending" ? "amber" : "blue"}>{o.status}</Badge></td>
                      <td className="py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Top Selling Items</h2>
            </div>
            <ul className="space-y-3">
              {topItems.map((it, idx) => (
                <li key={it.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.qty} sold</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold">₹{it.revenue.toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
