import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "My Results — ExamFlow" }] }),
  component: () => <Protected requireRole="student"><AppShell><ResultsList /></AppShell></Protected>,
});

function ResultsList() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-results", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attempts")
        .select("*, exams(title,subject)")
        .eq("student_id", user!.id)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold">My results</h1>
      <p className="text-muted-foreground mt-1">All your submitted exams and scores.</p>
      <div className="mt-8 space-y-3">
        {(data || []).map((a: any) => {
          const pct = Number(a.percentage || 0);
          const passed = pct >= 50;
          return (
            <Link key={a.id} to="/results/$attemptId" params={{ attemptId: a.id }}
              className="glass-card rounded-xl p-5 flex items-center justify-between hover:border-primary/50 transition-colors">
              <div>
                <div className="text-xs text-muted-foreground">{a.exams?.subject}</div>
                <div className="font-display font-semibold text-lg">{a.exams?.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(a.submitted_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-display font-bold">{a.score}/{a.total}</div>
                <div className={`text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1 ${
                  passed ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                }`}>
                  <TrendingUp className="size-3" /> {pct.toFixed(0)}% • {passed ? "Pass" : "Fail"}
                </div>
              </div>
            </Link>
          );
        })}
        {data && data.length === 0 && (
          <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
            <Trophy className="size-10 mx-auto opacity-40" />
            <div className="mt-3">No completed exams yet — take one to see results here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
