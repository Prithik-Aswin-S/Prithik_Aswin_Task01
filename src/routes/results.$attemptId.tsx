import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/results/$attemptId")({
  head: () => ({ meta: [{ title: "Result — ExamFlow" }] }),
  component: () => <Protected><AppShell><ResultPage /></AppShell></Protected>,
});

function ResultPage() {
  const { attemptId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      const { data: attempt } = await supabase
        .from("attempts").select("*, exams(title,subject)").eq("id", attemptId).single();
      const { data: review, error } = await supabase
        .rpc("get_attempt_review", { p_attempt_id: attemptId });
      if (error) throw error;
      return { attempt, ans: review || [] };
    },
  });
  if (!data?.attempt) return <div className="p-10">Loading…</div>;
  const a = data.attempt;
  const pct = Number(a.percentage || 0);
  const passed = pct >= 50;
  const wrong = (a.total || 0) - (a.score || 0);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <Link to="/results" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to results
      </Link>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-6">{a.exams?.subject}</div>
      <h1 className="font-display text-3xl font-bold">{a.exams?.title}</h1>

      <div className="glass-card rounded-2xl p-8 mt-8 grid md:grid-cols-2 gap-8 items-center">
        <div className="relative size-48 mx-auto">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.28 0.025 260)" strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={passed ? "oklch(0.7 0.16 152)" : "oklch(0.62 0.22 25)"}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 264} 264`} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-4xl font-display font-bold">{pct.toFixed(0)}%</div>
              <div className={`text-xs font-medium ${passed ? "text-success" : "text-destructive"}`}>
                {passed ? "PASSED" : "FAILED"}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Row label="Total questions" value={a.total} />
          <Row label="Correct" value={a.score} icon={<CheckCircle2 className="size-4 text-success" />} />
          <Row label="Wrong" value={wrong} icon={<XCircle className="size-4 text-destructive" />} />
          <Row label="Score" value={`${a.score}/${a.total}`} icon={<Trophy className="size-4 text-accent" />} />
        </div>
      </div>

      <h2 className="font-display text-xl font-semibold mt-10">Review</h2>
      <div className="mt-4 space-y-3">
        {data.ans.map((row: any, i: number) => {
          const q = row.questions;
          const ok = row.selected_answer === q.correct_answer;
          return (
            <div key={row.id} className="glass-card rounded-xl p-5">
              <div className="text-xs text-muted-foreground">Q{i + 1}</div>
              <div className="font-medium">{q.question_text}</div>
              <div className="mt-2 text-sm flex gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded-md ${ok ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                  Your answer: {row.selected_answer || "—"}
                </span>
                {!ok && (
                  <span className="px-2 py-1 rounded-md bg-success/20 text-success">
                    Correct: {q.correct_answer}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/exams"><Button>Take another exam</Button></Link>
        <Link to="/dashboard"><Button variant="outline">Dashboard</Button></Link>
      </div>
    </div>
  );
}

function Row({ label, value, icon }: any) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
      <span className="text-sm text-muted-foreground inline-flex items-center gap-2">{icon}{label}</span>
      <span className="font-display font-semibold">{value}</span>
    </div>
  );
}
