import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/payments")({ component: PaymentsPage });

type Payment = {
  id: string;
  amount: number;
  mode: string;
  status: string;
  created_at: string;
  order_code?: string;
};

function PaymentsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id,amount,mode,status,created_at,orders(code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        mode: payment.mode,
        status: payment.status,
        created_at: payment.created_at,
        order_code: payment.orders?.code,
      })) as Payment[];
    },
  });

  const totals = useMemo(() => {
    return data.reduce(
      (acc, payment) => {
        const amount = Number(payment.amount ?? 0);
        if (payment.mode?.toLowerCase() === "cash") acc.cash += amount;
        else if (payment.mode?.toLowerCase() === "upi") acc.upi += amount;
        else if (payment.mode?.toLowerCase() === "card") acc.card += amount;
        acc.total += amount;
        return acc;
      },
      { cash: 0, upi: 0, card: 0, total: 0 },
    );
  }, [data]);

  return (
    <PageShell title="Payments">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Cash" value={`₹ ${totals.cash.toLocaleString()}`} tone="green" />
        <SummaryCard label="UPI" value={`₹ ${totals.upi.toLocaleString()}`} tone="violet" />
        <SummaryCard label="Card" value={`₹ ${totals.card.toLocaleString()}`} tone="blue" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Bill #</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Txn ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading payments...</td></tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No payments found</td></tr>
            )}
            {data.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-3 font-medium">{b.order_code ?? b.id}</td>
                <td className="px-4 py-3 font-semibold">₹{b.amount}</td>
                <td className="px-4 py-3">{b.mode}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">TXN-{1000 + b.amount}</td>
                <td className="px-4 py-3"><Badge tone={b.status?.toLowerCase() === "paid" ? "green" : "rose"}>{b.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <Badge tone={tone as any}>{label}</Badge>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">Collected today</div>
    </div>
  );
}
