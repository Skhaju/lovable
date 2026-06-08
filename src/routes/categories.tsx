import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

type Category = { id: string; name: string; status: string; sort_order: number };

function CategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const save = useMutation({
    mutationFn: async (c: Partial<Category>) => {
      const name = (c.name ?? "").trim();
      if (!name) throw new Error("Name is required");
      if (c.id) {
        const { error } = await supabase.from("categories")
          .update({ name, status: c.status ?? "active", sort_order: c.sort_order ?? 0 })
          .eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories")
          .insert({ name, status: c.status ?? "active", sort_order: c.sort_order ?? 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null);
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell title="Categories" action={{ label: "Add Category", onClick: () => setEditing({ status: "active", sort_order: 0 }) }}>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Sort</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading...</td></tr>}
            {!isLoading && data.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No categories yet</td></tr>}
            {data.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 text-muted-foreground">{c.sort_order}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.status === "active" ? "green" : "slate"}>{c.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(c)} className="mr-3 text-primary hover:underline">Edit</button>
                  <button onClick={() => { if (confirm("Delete this category?")) remove.mutate(c.id); }} className="text-rose-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                <Input required value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sort order</label>
                  <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
                  <select value={editing.status ?? "active"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm h-9">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>
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