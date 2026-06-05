import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, FileQuestion, BookOpen } from "lucide-react";

export const Route = createFileRoute("/exams")({
  head: () => ({ meta: [{ title: "Exams — ExamFlow" }] }),
  component: () => <Protected requireRole="student"><AppShell><ExamsPage /></AppShell></Protected>,
});

function ExamsPage() {
  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exams")
        .select("*, questions(count)")
        .order("created_at", { ascending: false });
      return data;
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Available exams</h1>
      <p className="text-muted-foreground mt-1">Pick an exam to begin. Your timer starts immediately.</p>
      {isLoading && <div className="mt-8 text-muted-foreground">Loading…</div>}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {(exams || []).map((e: any) => (
          <div key={e.id} className="glass-card rounded-2xl p-6 flex flex-col">
            <div className="flex items-start justify-between">
              <div className="size-10 rounded-xl gradient-accent grid place-items-center">
                <BookOpen className="size-5 text-accent-foreground" />
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{e.subject}</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">{e.title}</h3>
            {e.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
            <div className="flex gap-4 text-xs text-muted-foreground mt-4">
              <span className="inline-flex items-center gap-1"><FileQuestion className="size-3" /> {e.questions?.[0]?.count ?? 0} questions</span>
              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {e.duration_minutes} min</span>
            </div>
            <Link to="/exam/$examId" params={{ examId: e.id }} className="mt-5">
              <Button className="w-full">Start exam</Button>
            </Link>
          </div>
        ))}
        {exams && exams.length === 0 && (
          <div className="glass-card rounded-2xl p-8 col-span-full text-center text-muted-foreground">
            No exams available yet.
          </div>
        )}
      </div>
    </div>
  );
}
