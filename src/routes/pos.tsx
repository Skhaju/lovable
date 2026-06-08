import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/topbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Minus, Plus, Trash2, Save, ChefHat, Receipt, CreditCard, Printer, StickyNote } from "lucide-react";

export const Route = createFileRoute("/pos")({ component: POS });

type Category = { id: string; name: string; status: string };
type Item = { id: string; category_id: string | null; name: string; price: number; tax: number; type: string; available: boolean };
type Table = { id: string; name: string; capacity: number; status: string };
type CartLine = { id: string; name: string; price: number; tax: number; qty: number; note?: string };
type PaymentMode = "cash" | "upi" | "card";

function POS() {
  const qc = useQueryClient();
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["pos", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name,status").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["pos", "items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("id,category_id,name,price,tax,type,available");
      if (error) throw error;
      return data as Item[];
    },
  });

  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ["pos", "tables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dining_tables").select("id,name,capacity,status");
      if (error) throw error;
      return data as Table[];
    },
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!activeTable || cart.length === 0) {
        throw new Error("Select a table and add items before payment.");
      }

      const table = tables.find((t) => t.id === activeTable);
      const sub = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
      const tx = cart.reduce((sum, l) => sum + (l.price * l.qty * l.tax) / 100, 0);
      const total = Math.round(sub + tx - discount);

      // If there's an existing open order for this table, update it to paid.
      const { data: existingOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("table_id", activeTable)
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: false })
        .limit(1);

      let orderId: string | number | null = null;
      if (existingOrders && existingOrders.length > 0) {
        orderId = existingOrders[0].id;
        const { error: updErr } = await supabase.from("orders").update({ status: "paid", subtotal: sub, tax: tx, discount, total }).eq("id", orderId);
        if (updErr) throw updErr;
        // replace order items
        const { error: delErr } = await supabase.from("order_items").delete().eq("order_id", orderId);
        if (delErr) throw delErr;
        const orderItems = cart.map((line) => ({ order_id: orderId, item_id: line.id, name: line.name, qty: line.qty, price: line.price, tax: line.tax }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      } else {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert([
            {
              table_id: activeTable,
              table_name: table?.name ?? "",
              status: "paid",
              subtotal: sub,
              tax: tx,
              discount,
              total,
            },
          ])
          .select("id")
          .single();
        if (orderError || !orderData) throw orderError ?? new Error("Failed to create order.");
        orderId = orderData.id;
        const orderItems = cart.map((line) => ({ order_id: orderId, item_id: line.id, name: line.name, qty: line.qty, price: line.price, tax: line.tax }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      const { error: paymentError } = await supabase.from("payments").insert([
        {
          order_id: orderId,
          amount: total,
          mode: paymentMode,
          status: "paid",
        },
      ]);
      if (paymentError) throw paymentError;

      return orderId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["kot"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "payments"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setCart([]);
      setDiscount(0);
      toast.success("Payment recorded successfully.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!activeCat && categories.length > 0) setActiveCat(categories[0].id);
    if (!activeTable && tables.length > 0) setActiveTable(tables[0].id);
  }, [categories, tables, activeCat, activeTable]);

  useEffect(() => {
    if (activeTable) {
      setCart([]);
      setDiscount(0);
    }
  }, [activeTable]);

  // Load saved (pending/preparing) order for selected table and populate cart
  const { data: savedOrder } = useQuery({
    queryKey: ["pos", "savedOrder", activeTable],
    enabled: !!activeTable,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,subtotal,tax,discount,total,order_items(item_id,name,qty,price,tax)")
        .eq("table_id", activeTable)
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data && data.length ? data[0] : null;
    },
  });

  useEffect(() => {
    if (savedOrder && savedOrder.order_items) {
      setCart(savedOrder.order_items.map((oi: any) => ({ id: oi.item_id, name: oi.name, price: Number(oi.price), tax: Number(oi.tax), qty: oi.qty })));
      setDiscount(Number(savedOrder.discount) || 0);
    }
  }, [savedOrder]);

  // Save (upsert) order as pending/preparing
  const saveMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      if (!activeTable) throw new Error("Select a table before saving.");
      const table = tables.find((t) => t.id === activeTable);
      const sub = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
      const tx = cart.reduce((sum, l) => sum + (l.price * l.qty * l.tax) / 100, 0);
      const total = Math.round(sub + tx - discount);

      // check existing open order
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("table_id", activeTable)
        .in("status", ["pending", "preparing"])
        .order("created_at", { ascending: false })
        .limit(1);

      let orderId: any = null;
      if (existing && existing.length > 0) {
        orderId = existing[0].id;
        const { error: updErr } = await supabase.from("orders").update({ status, subtotal: sub, tax: tx, discount, total }).eq("id", orderId);
        if (updErr) throw updErr;
        await supabase.from("order_items").delete().eq("order_id", orderId);
      } else {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert([{ table_id: activeTable, table_name: table?.name ?? "", status, subtotal: sub, tax: tx, discount, total }])
          .select("id")
          .single();
        if (orderError || !orderData) throw orderError ?? new Error("Failed to create order.");
        orderId = orderData.id;
      }

      if (cart.length > 0) {
        const orderItems = cart.map((line) => ({ order_id: orderId, item_id: line.id, name: line.name, qty: line.qty, price: line.price, tax: line.tax }));
        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;
      }

      return orderId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos", "savedOrder"] });
      qc.invalidateQueries({ queryKey: ["kot"] });
      toast.success("Saved to KOT.");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save."),
  });

  const filtered = useMemo(() => items.filter((i) => i.category_id === activeCat), [items, activeCat]);

  const addToCart = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setCart((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: it.id, name: it.name, price: Number(it.price), tax: Number(it.tax), qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => setCart((p) => p.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l)));

  const removeLine = (id: string) => setCart((p) => p.filter((l) => l.id !== id));

  const printOrder = () => window.print();

  const { subtotal, tax, total } = useMemo(() => {
    const sub = cart.reduce((s, l) => s + l.price * l.qty, 0);
    const tx = cart.reduce((s, l) => s + (l.price * l.qty * l.tax) / 100, 0);
    const t = sub + tx - discount;
    return { subtotal: sub, tax: tx, total: Math.round(t) };
  }, [cart, discount]);

  return (
    <>
      <TopBar title="POS Billing" />
      <div className="grid h-[calc(100vh-3.5rem)] grid-cols-12 gap-3 overflow-hidden p-3">
        <aside className="col-span-2 overflow-y-auto rounded-xl border bg-card p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Tables</h3>
          {(loadingTables ? Array.from({ length: 4 }) : tables).map((t: any) => {
            if (!t) return <div key={Math.random()} className="h-16 rounded-lg bg-muted/80 animate-pulse" />;
            const active = t.id === activeTable;
            const sc: Record<string, string> = {
              available: "border-emerald-300 bg-emerald-50 text-emerald-700",
              occupied: "border-blue-300 bg-blue-50 text-blue-700",
              billing: "border-amber-300 bg-amber-50 text-amber-700",
              reserved: "border-violet-300 bg-violet-50 text-violet-700",
            };
            return (
              <button key={t.id} onClick={() => setActiveTable(t.id)} className={`mb-2 rounded-lg border p-2 text-center transition ${sc[t.status] ?? "border-slate-200 bg-slate-50"} ${active ? "ring-2 ring-primary" : ""}`}>
                <div className="text-sm font-bold">{t.name}</div>
                <div className="text-[10px] opacity-70">{t.capacity} seats</div>
              </button>
            );
          })}
        </aside>

        <section className="col-span-7 flex flex-col gap-3 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto rounded-xl border bg-card p-2">
            {(loadingCategories ? Array.from({ length: 4 }) : categories).map((c: any) => {
              if (!c) return <div key={Math.random()} className="h-10 w-24 rounded-lg bg-muted/80 animate-pulse" />;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)} className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${activeCat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}>
                  {c.name}
                </button>
              );
            })}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
            {(loadingItems ? Array.from({ length: 8 }) : filtered).map((it: any) => {
              if (!it) return <div key={Math.random()} className="h-40 rounded-xl bg-muted/80 animate-pulse" />;
              return (
                <button disabled={!it.available} onClick={() => addToCart(it.id)} className="group flex flex-col items-start rounded-xl border bg-card p-3 text-left shadow-sm transition hover:border-primary hover:shadow-md disabled:opacity-40">
                  <div className="mb-2 flex h-20 w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-slate-100 text-2xl">🍽️</div>
                  <div className="flex w-full items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-sm border ${it.type === "veg" ? "border-emerald-600 bg-emerald-500" : "border-rose-600 bg-rose-500"}`} />
                    <span className="flex-1 truncate text-sm font-semibold">{it.name}</span>
                  </div>
                  <div className="mt-1 flex w-full items-center justify-between">
                    <span className="text-sm font-bold text-primary">₹{it.price}</span>
                    {!it.available && <span className="text-[10px] text-rose-600">Unavailable</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="col-span-3 flex flex-col rounded-xl border bg-card">
          <div className="border-b p-3">
            <div className="text-xs text-muted-foreground">Current Order</div>
            <div className="flex items-center justify-between">
              <div className="text-base font-bold">Table {tables.find((t) => t.id === activeTable)?.name ?? "-"}</div>
              <div className="text-xs text-muted-foreground">#ORD-1043</div>
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {cart.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Tap items to add</p>}
            {cart.map((l) => (
              <div key={l.id} className="rounded-lg border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">{l.name}</div>
                    <div className="text-xs text-muted-foreground">₹{l.price} each</div>
                  </div>
                  <button onClick={() => removeLine(l.id)} className="text-muted-foreground hover:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 rounded-lg border">
                    <button onClick={() => updateQty(l.id, -1)} className="px-2 py-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="min-w-[1.5rem] text-center text-sm font-semibold">{l.qty}</span>
                    <button onClick={() => updateQty(l.id, 1)} className="px-2 py-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                  </div>
                  <div className="text-sm font-bold">₹{l.price * l.qty}</div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
                  <StickyNote className="h-3 w-3 text-muted-foreground" />
                  <input placeholder="Add note (less spicy…)" className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-3 space-y-2 text-sm">
            <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
            <Row label="Tax (5%)" value={`₹${tax.toFixed(2)}`} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Discount</span>
              <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="w-20 rounded border px-2 py-1 text-right text-sm outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <Row label="Round Off" value={`₹${(Math.round(subtotal + tax - discount) - (subtotal + tax - discount)).toFixed(2)}`} />
            <div className="my-2 border-t pt-2 flex items-center justify-between"><span className="font-semibold">Grand Total</span><span className="text-xl font-bold text-primary">₹{total}</span></div>
            <div className="rounded-xl border bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">Payment Mode</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["cash", "upi", "card"] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`rounded-lg px-2 py-2 text-xs font-semibold ${paymentMode === mode ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}>
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => saveMutation.mutate({ status: "pending" })} className="flex items-center justify-center gap-1.5 rounded-lg border bg-background py-2 text-xs font-medium hover:bg-muted"><Save className="h-3.5 w-3.5" /> Save</button>
              <button onClick={() => saveMutation.mutate({ status: "preparing" })} className="flex items-center justify-center gap-1.5 rounded-lg border bg-background py-2 text-xs font-medium hover:bg-muted"><ChefHat className="h-3.5 w-3.5" /> Send KOT</button>
              <ActionBtn icon={Receipt} label="Bill" />
              <button onClick={printOrder} className="flex items-center justify-center gap-1.5 rounded-lg border bg-background py-2 text-xs font-medium hover:bg-muted"><Printer className="h-3.5 w-3.5" /> Print</button>
              <button
                type="button"
                onClick={() => orderMutation.mutate()}
                disabled={cart.length === 0 || orderMutation.isLoading}
                className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50">
                <CreditCard className="h-4 w-4" /> Pay ₹{total}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: typeof Save; label: string }) {
  return (
    <button className="flex items-center justify-center gap-1.5 rounded-lg border bg-background py-2 text-xs font-medium hover:bg-muted"><Icon className="h-3.5 w-3.5" /> {label}</button>
  );
}
