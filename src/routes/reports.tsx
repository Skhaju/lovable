import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

type OrdersReport = { total: number; created_at: string };
type ItemReport = { name: string; qty: number; price: number };

function ReportsPage() {
  const [from, setFrom] = useState(() => new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState("Daily Sales");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports", from, to, reportType],
    queryFn: async () => {
      const ordersRes = await supabase.from("orders").select("total,created_at").gte("created_at", `${from}T00:00:00Z`).lte("created_at", `${to}T23:59:59Z`);
      if (ordersRes.error) throw ordersRes.error;
      const itemsRes = await supabase.from("order_items").select("name,qty,price,created_at").gte("created_at", `${from}T00:00:00Z`).lte("created_at", `${to}T23:59:59Z`);
      if (itemsRes.error) throw itemsRes.error;
      return { orders: ordersRes.data ?? [], items: itemsRes.data ?? [] } as { orders: OrdersReport[]; items: ItemReport[] };
    },
    enabled: Boolean(from && to),
  });

  const summary = useMemo(() => {
    const orders = data?.orders ?? [];
    const items = data?.items ?? [];
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
    return {
      revenue: totalRevenue,
      orders: orders.length,
      avgBill: orders.length ? totalRevenue / orders.length : 0,
      topItems: Object.values(items.reduce((acc, item) => {
        const name = item.name || "Unknown";
        if (!acc[name]) acc[name] = { name, qty: 0, revenue: 0 };
        acc[name].qty += Number(item.qty ?? 0);
        acc[name].revenue += Number(item.price ?? 0) * Number(item.qty ?? 0);
        return acc;
      }, {} as Record<string, { name: string; qty: number; revenue: number }>)).sort((a, b) => b.qty - a.qty).slice(0, 10),
    };
  }, [data]);

  return (
    <PageShell title="Reports">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Field label="From"><input type="date" className="rounded-md border px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className="rounded-md border px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="Report Type">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option>Daily Sales</option>
            <option>Item-wise</option>
            <option>Category-wise</option>
            <option>Payment Mode</option>
            <option>Cashier-wise</option>
            <option>GST</option>
          </select>
        </Field>
        <button onClick={() => refetch()} className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Generate</button>
        <button className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"><FileText className="h-4 w-4" /> PDF</button>
        <button className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
        <button className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"><Download className="h-4 w-4" /> CSV</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Revenue" value={`₹ ${summary.revenue.toLocaleString()}`} subtitle={`${from} - ${to}`} />
        <StatCard label="Total Orders" value={`${summary.orders}`} subtitle={`${summary.orders ? (summary.revenue / summary.orders).toFixed(1) : 0} avg`} />
        <StatCard label="Avg. Bill" value={`₹ ${summary.avgBill.toFixed(2)}`} subtitle="Based on selected range" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-3 text-sm font-semibold">Item-wise Sales</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
              <th className="px-4 py-3 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {summary.topItems.map((i) => (
              <tr key={i.name} className="border-t">
                <td className="px-4 py-3 font-medium">{i.name}</td>
                <td className="px-4 py-3">{i.qty}</td>
                <td className="px-4 py-3 font-semibold">₹{i.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, summary.revenue ? (i.revenue / summary.revenue) * 100 : 0)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{summary.revenue ? ((i.revenue / summary.revenue) * 100).toFixed(1) : 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {summary.topItems.length === 0 && !isLoading && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No data for the selected range</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}
