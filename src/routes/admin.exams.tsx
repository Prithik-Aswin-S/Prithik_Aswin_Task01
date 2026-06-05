import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Manage exams — Admin" }] }),
  component: () => <Protected requireRole="admin"><AppShell><AdminExams /></AppShell></Protected>,
});

function AdminExams() {
  const qc = useQueryClient();
  const { data: exams } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const { data } = await supabase.from("exams").select("*, questions(count)").order("created_at", { ascending: false });
      return data;
    },
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", description: "", duration_minutes: 30 });

  const create = async () => {
    if (!form.title.trim() || !form.subject.trim()) { toast.error("Title and subject required"); return; }
    const { error } = await supabase.from("exams").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Exam created");
    setOpen(false); setForm({ title: "", subject: "", description: "", duration_minutes: 30 });
    qc.invalidateQueries({ queryKey: ["admin-exams"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this exam and all its questions?")) return;
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-exams"] });
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Manage exams</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="size-4" /> New exam</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create exam</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Duration (minutes)</Label>
                <Input type="number" min={1} value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
              </div>
            </div>
            <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 space-y-3">
        {(exams || []).map((e: any) => (
          <div key={e.id} className="glass-card rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-muted-foreground">{e.subject} • {e.duration_minutes} min • {e.questions?.[0]?.count ?? 0} questions</div>
              <div className="font-display font-semibold text-lg">{e.title}</div>
              {e.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-1">{e.description}</div>}
            </div>
            <div className="flex gap-2">
              <Link to="/admin/exams/$examId" params={{ examId: e.id }}>
                <Button variant="outline" size="sm" className="gap-1"><Pencil className="size-4" /> Manage</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => remove(e.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
