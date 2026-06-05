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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exams/$examId")({
  head: () => ({ meta: [{ title: "Edit exam — Admin" }] }),
  component: () => <Protected requireRole="admin"><AppShell><EditExam /></AppShell></Protected>,
});

const emptyQ = { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A" };

function EditExam() {
  const { examId } = Route.useParams();
  const qc = useQueryClient();
  const { data: exam } = useQuery({
    queryKey: ["exam-edit", examId],
    queryFn: async () => (await supabase.from("exams").select("*").eq("id", examId).single()).data,
  });
  const { data: questions } = useQuery({
    queryKey: ["exam-questions", examId],
    queryFn: async () => (await supabase.from("questions").select("*").eq("exam_id", examId).order("position")).data,
  });

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState<any>(emptyQ);

  const addQ = async () => {
    if (!q.question_text.trim()) return toast.error("Question required");
    const position = (questions?.length ?? 0) + 1;
    const { error } = await supabase.from("questions").insert({ ...q, exam_id: examId, position });
    if (error) return toast.error(error.message);
    toast.success("Question added");
    setQ(emptyQ); setOpen(false);
    qc.invalidateQueries({ queryKey: ["exam-questions", examId] });
  };

  const removeQ = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["exam-questions", examId] });
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <Link to="/admin/exams" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to exams
      </Link>
      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{exam?.subject}</div>
          <h1 className="font-display text-3xl font-bold">{exam?.title}</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button className="gap-2" onClick={() => setOpen(true)}><Plus className="size-4" /> Add question</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>New question</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Question</Label><Textarea value={q.question_text} onChange={(e) => setQ({ ...q, question_text: e.target.value })} /></div>
              {(["a","b","c","d"] as const).map((L) => (
                <div key={L} className="space-y-1.5">
                  <Label>Option {L.toUpperCase()}</Label>
                  <Input value={q[`option_${L}`]} onChange={(e) => setQ({ ...q, [`option_${L}`]: e.target.value })} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Correct answer</Label>
                <Select value={q.correct_answer} onValueChange={(v) => setQ({ ...q, correct_answer: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["A","B","C","D"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={addQ}>Add question</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 space-y-3">
        {(questions || []).map((qq, i) => (
          <div key={qq.id} className="glass-card rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Q{i + 1} • Correct: {qq.correct_answer}</div>
                <div className="font-medium">{qq.question_text}</div>
                <div className="mt-2 grid sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                  <div>A. {qq.option_a}</div><div>B. {qq.option_b}</div>
                  <div>C. {qq.option_c}</div><div>D. {qq.option_d}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeQ(qq.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {questions && questions.length === 0 && (
          <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">No questions yet. Add the first one.</div>
        )}
      </div>
    </div>
  );
}
