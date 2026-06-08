import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Badge } from "@/components/page-shell";
import { Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/tables")({ component: TablesPage });

type DTable = { id: string; name: string; capacity: number; status: string };

const tone = (s: string) =>
  s === "available" ? "green" : s === "occupied" ? "blue" : s === "billing" ? "amber" : "violet";

function TablesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<DTable> | null>(null);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["dining_tables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dining_tables").select("*").order("name");
      if (error) throw error;
      return data as DTable[];
    },
  });

  const save = useMutation({
    mutationFn: async (t: Partial<DTable>) => {
      const name = (t.name ?? "").trim();
      if (!name) throw new Error("Name is required");
      const payload = { name, capacity: Number(t.capacity ?? 2), status: t.status ?? "available" };
      if (t.id) {
        const { error } = await supabase.from("dining_tables").update(payload).eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dining_tables").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dining_tables"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dining_tables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dining_tables"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell title="Dining Tables" action={{ label: "Add Table", onClick: () => setEditing({ capacity: 2, status: "available" }) }}>
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tables.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="text-2xl font-bold">{t.name}</div>
              <Badge tone={tone(t.status) as "green"}>{t.status}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {t.capacity} seats
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing(t)} className="flex-1 rounded-md border py-1.5 text-xs hover:bg-muted">Edit</button>
              <button onClick={() => { if (confirm(`Delete ${t.name}?`)) remove.mutate(t.id); }} className="flex-1 rounded-md border py-1.5 text-xs text-rose-600 hover:bg-rose-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Table" : "Add Table"}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
                <Input required value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Capacity</label>
                  <Input type="number" min={1} value={editing.capacity ?? 2} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
                  <select value={editing.status ?? "available"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm h-9">
                    <option value="available">available</option>
                    <option value="occupied">occupied</option>
                    <option value="billing">billing</option>
                    <option value="reserved">reserved</option>
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