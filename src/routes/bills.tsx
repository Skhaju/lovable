import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/bills")({ component: BillsPage });

type BillRow = { id: string; amount: number; mode: string; status: string; created_at: string; orders: { code: string; table_name: string } | null };

function BillsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("id,amount,mode,status,created_at,orders(code,table_name)").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as BillRow[];
    },
  });

  const printBill = () => window.print();

  return (
    <PageShell title="Bills">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Bill #</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading bills...</td></tr>}
              {!isLoading && data.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No bills found</td></tr>}
              {data.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{b.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.orders?.code ?? "-"}</td>
                  <td className="px-4 py-3">{b.orders?.table_name ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold">₹{b.amount}</td>
                  <td className="px-4 py-3">{b.mode}</td>
                  <td className="px-4 py-3"><Badge tone={b.status === "paid" ? "green" : "rose"}>{b.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border bg-white p-5 font-mono text-xs text-black shadow-sm" style={{ maxWidth: 320 }}>
          <div className="text-center">
            <div className="text-sm font-bold">ADAPT RESTAURANT</div>
            <div>123 Main Street, Mumbai</div>
            <div>Phone: +91 98765 43210</div>
            <div>GSTIN: 27AAAAA0000A1Z5</div>
          </div>
          <div className="my-2 border-y border-dashed border-black py-1">
            <div className="flex justify-between"><span>Bill</span><span>{data[0]?.id ?? "-"}</span></div>
            <div className="flex justify-between"><span>Table</span><span>{data[0]?.orders?.table_name ?? "-"}</span></div>
          </div>
          <div className="flex justify-between font-bold"><span>Item</span><span>Total</span></div>
          <div className="border-b border-dashed border-black pb-1">
            <div className="flex justify-between"><span>Sample Item</span><span>₹120</span></div>
          </div>
          <div className="mt-2 space-y-0.5">
            <BRow l="Subtotal" v="₹120" />
            <BRow l="Tax 5%" v="₹6.00" />
            <BRow l="Round Off" v="₹0" />
            <div className="mt-1 flex justify-between border-t border-dashed border-black pt-1 text-sm font-bold"><span>TOTAL</span><span>₹126</span></div>
          </div>
          <div className="mt-3 text-center border-t border-dashed border-black pt-2">Thank you! Visit again</div>
          <button onClick={printBill} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-black py-1.5 text-xs font-semibold text-white"><Printer className="h-3 w-3" /> Print Bill</button>
        </div>
      </div>
    </PageShell>
  );
}

function BRow({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between"><span>{l}</span><span>{v}</span></div>;
}
