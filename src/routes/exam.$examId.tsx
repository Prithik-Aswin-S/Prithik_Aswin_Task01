import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exam/$examId")({
  head: () => ({ meta: [{ title: "Exam in progress — ExamFlow" }] }),
  component: () => <Protected requireRole="student"><ExamRunner /></Protected>,
});

type Question = {
  id: string; question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  q_position: number;
};

function ExamRunner() {
  const { examId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: e } = await supabase.from("exams").select("*").eq("id", examId).single();
        if (!e) { toast.error("Exam not found"); navigate({ to: "/exams" }); return; }
        const { data: qs, error: qErr } = await supabase
          .rpc("get_exam_questions", { p_exam_id: examId });
        if (qErr) throw qErr;
        const { data: attempt } = await supabase.from("attempts")
          .insert({ student_id: user!.id, exam_id: examId, status: "in_progress", total: qs?.length ?? 0 })
          .select().single();
        setExam(e);
        setQuestions((qs as Question[]) || []);
        setAttemptId(attempt!.id);
        setSecondsLeft(e.duration_minutes * 60);
      } catch (err: any) {
        toast.error(err.message ?? "Failed to start exam");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Timer
  useEffect(() => {
    if (loading || !attemptId) return;
    const i = setInterval(() => setSecondsLeft((s) => {
      if (s <= 1) {
        clearInterval(i);
        if (!submittedRef.current) submit(true);
        return 0;
      }
      return s - 1;
    }), 1000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, attemptId]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
  };

  const selectAnswer = async (qid: string, letter: string) => {
    setAnswers((a) => ({ ...a, [qid]: letter }));
    if (!attemptId) return;
    await supabase.from("attempt_answers").upsert(
      { attempt_id: attemptId, question_id: qid, selected_answer: letter, updated_at: new Date().toISOString() },
      { onConflict: "attempt_id,question_id" }
    );
  };

  const submit = async (auto = false) => {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    const { error } = await supabase.rpc("submit_attempt", { p_attempt_id: attemptId });
    if (error) {
      submittedRef.current = false;
      toast.error(error.message ?? "Failed to submit exam");
      return;
    }
    toast.success(auto ? "Time up — auto-submitted" : "Exam submitted");
    navigate({ to: "/results/$attemptId", params: { attemptId } });
  };

  const current = questions[idx];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  const lowTime = secondsLeft > 0 && secondsLeft <= 300;

  if (loading || !current) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border glass-card rounded-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{exam?.subject}</div>
            <h1 className="font-display text-lg font-bold">{exam?.title}</h1>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-semibold ${
            lowTime ? "bg-destructive/20 text-destructive border border-destructive/40 animate-pulse" : "bg-secondary"
          }`}>
            {lowTime ? <AlertTriangle className="size-4" /> : <Clock className="size-4" />}
            {fmt(secondsLeft)}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[240px_1fr] gap-6 p-6">
        <aside className="glass-card rounded-2xl p-4 h-fit lg:sticky lg:top-6">
          <div className="text-xs text-muted-foreground mb-3">{answered}/{questions.length} answered</div>
          <div className="grid grid-cols-6 lg:grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const isCurrent = i === idx;
              const isAnswered = !!answers[q.id];
              return (
                <button key={q.id} onClick={() => setIdx(i)}
                  className={`size-9 rounded-lg text-sm font-medium transition-all ${
                    isCurrent ? "ring-2 ring-primary bg-primary/20 text-foreground"
                    : isAnswered ? "bg-success/30 text-success-foreground border border-success/40"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <Button className="w-full mt-4" onClick={() => setConfirmOpen(true)}>Submit exam</Button>
        </aside>

        <section className="glass-card rounded-2xl p-6 md:p-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Question {idx + 1} of {questions.length}</div>
          <h2 className="mt-2 font-display text-xl md:text-2xl font-semibold leading-snug">{current.question_text}</h2>
          <div className="mt-6 space-y-3">
            {(["A","B","C","D"] as const).map((L) => {
              const text = current[`option_${L.toLowerCase()}` as "option_a"];
              const selected = answers[current.id] === L;
              return (
                <button key={L} onClick={() => selectAnswer(current.id, L)}
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
                    selected ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-secondary/40 hover:bg-secondary"
                  }`}>
                  <div className={`size-8 shrink-0 rounded-lg grid place-items-center font-semibold ${
                    selected ? "bg-primary text-primary-foreground" : "bg-background/40 text-foreground"
                  }`}>{L}</div>
                  <div className="pt-1">{text}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>Previous</Button>
            {idx < questions.length - 1
              ? <Button onClick={() => setIdx((i) => i + 1)}>Next</Button>
              : <Button onClick={() => setConfirmOpen(true)}>Submit</Button>}
          </div>
        </section>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You've answered {answered} of {questions.length} questions. Once submitted, you cannot change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit(false)}>Submit now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
