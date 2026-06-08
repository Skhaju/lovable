import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

type Settings = {
  id: string;
  restaurant_name: string; phone: string | null; email: string | null;
  gst_number: string | null; address: string | null;
  currency_symbol: string; printer_size: string; bill_footer: string | null;
  tax_enabled: boolean; show_gst: boolean; logo_url: string | null;
};

const defaultSettings: Settings = {
  id: "default",
  restaurant_name: "",
  phone: null,
  email: null,
  gst_number: null,
  address: null,
  currency_symbol: "₹",
  printer_size: "80mm",
  bill_footer: null,
  tax_enabled: false,
  show_gst: false,
  logo_url: null,
};

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", "default").maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
  });
  const [form, setForm] = useState<Settings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
    else if (!isLoading && data === null && form === null) setForm(defaultSettings);
  }, [data, isLoading, form]);

  const save = useMutation({
    mutationFn: async (s: Settings) => {
      const { error } = await supabase.from("settings").upsert(
        {
          id: "default",
          restaurant_name: s.restaurant_name,
          phone: s.phone,
          email: s.email,
          gst_number: s.gst_number,
          address: s.address,
          currency_symbol: s.currency_symbol,
          printer_size: s.printer_size,
          bill_footer: s.bill_footer,
          tax_enabled: s.tax_enabled,
          show_gst: s.show_gst,
          logo_url: s.logo_url,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Settings saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form) {
    return <PageShell title="Settings"><p className="text-sm text-muted-foreground">Loading...</p></PageShell>;
  }

  const upd = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v });

  return (
    <PageShell title="Settings">
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">Restaurant Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Restaurant Name" v={form.restaurant_name} on={(v) => upd("restaurant_name", v)} required />
            <F label="Phone" v={form.phone ?? ""} on={(v) => upd("phone", v)} />
            <F label="Email" v={form.email ?? ""} on={(v) => upd("email", v)} type="email" />
            <F label="GST Number" v={form.gst_number ?? ""} on={(v) => upd("gst_number", v)} />
            <div className="sm:col-span-2"><F label="Address" v={form.address ?? ""} on={(v) => upd("address", v)} /></div>
            <F label="Currency Symbol" v={form.currency_symbol} on={(v) => upd("currency_symbol", v)} />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Printer Size</label>
              <select value={form.printer_size} onChange={(e) => upd("printer_size", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="80mm">80mm</option>
                <option value="58mm">58mm</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Bill Footer Message</label>
              <textarea rows={2} value={form.bill_footer ?? ""} onChange={(e) => upd("bill_footer", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" disabled={save.isPending}
            className="mt-5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            Save changes
          </button>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Logo URL</h3>
          <input value={form.logo_url ?? ""} onChange={(e) => upd("logo_url", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          {form.logo_url && (
            <img src={form.logo_url} alt="Logo preview" className="mt-3 h-24 w-full rounded-md border object-contain" />
          )}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Tax</h4>
            <label className="flex items-center justify-between text-sm">
              <span>Enable Tax</span>
              <input type="checkbox" checked={form.tax_enabled} onChange={(e) => upd("tax_enabled", e.target.checked)} className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Show GST on Bill</span>
              <input type="checkbox" checked={form.show_gst} onChange={(e) => upd("show_gst", e.target.checked)} className="h-4 w-4" />
            </label>
          </div>
        </div>
      </form>
    </PageShell>
  );
}

function F({ label, v, on, type = "text", required }: { label: string; v: string; on: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type} required={required} value={v} onChange={(e) => on(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
    </div>
  );
}
