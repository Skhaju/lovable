import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/items")({ component: ItemsPage });

type Item = {
  id: string; category_id: string | null; name: string;
  price: number; tax: number; type: string; available: boolean;
};
type Category = { id: string; name: string };

function ItemsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Item> | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").order("name");
      if (error) throw error;
      return data as Item[];
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const save = useMutation({
    mutationFn: async (i: Partial<Item>) => {
      const name = (i.name ?? "").trim();
      if (!name) throw new Error("Name is required");
      const payload = {
        name, category_id: i.category_id || null,
        price: Number(i.price ?? 0), tax: Number(i.tax ?? 0),
        type: i.type ?? "veg", available: i.available ?? true,
      };
      if (i.id) {
        const { error } = await supabase.from("items").update(payload).eq("id", i.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "-";

  return (
    <PageShell title="Items" action={{ label: "Add Item", onClick: () => setEditing({ type: "veg", available: true, tax: 5, price: 0 }) }}>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Tax</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading...</td></tr>}
            {!isLoading && items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No items yet</td></tr>}
            {items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-4 py-3 font-medium">{i.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{catName(i.category_id)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-3 w-3 rounded-sm border ${i.type === "veg" ? "border-emerald-600 bg-emerald-500" : "border-rose-600 bg-rose-500"}`} />
                    <span className="capitalize">{i.type}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">₹{Number(i.price).toFixed(0)}</td>
                <td className="px-4 py-3">{i.tax}%</td>
                <td className="px-4 py-3">
                  <Badge tone={i.available ? "green" : "rose"}>{i.available ? "Yes" : "No"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(i)} className="mr-3 text-primary hover:underline">Edit</button>
                  <button onClick={() => { if (confirm("Delete this item?")) remove.mutate(i.id); }} className="text-rose-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                <Input required value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                  <select value={editing.category_id ?? ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm h-9">
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</label>
                  <select value={editing.type ?? "veg"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm h-9">
                    <option value="veg">veg</option>
                    <option value="nonveg">nonveg</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Price (₹)</label>
                  <Input type="number" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tax %</label>
                  <Input type="number" step="0.01" value={editing.tax ?? 0} onChange={(e) => setEditing({ ...editing, tax: Number(e.target.value) })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.available ?? true}
                  onChange={(e) => setEditing({ ...editing, available: e.target.checked })} />
                Available
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={save.isPending}>Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}