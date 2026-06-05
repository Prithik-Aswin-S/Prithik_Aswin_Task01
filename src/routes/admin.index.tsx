import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, FileText, Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — ExamFlow" }] }),
  component: () => <Protected requireRole="admin"><AppShell><AdminHome /></AppShell></Protected>,
});

function AdminHome() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [exams, qs, attempts, students] = await Promise.all([
        supabase.from("exams").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("attempts").select("id,percentage,status"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "student"),
      ]);
      const submitted = (attempts.data || []).filter((a) => a.status === "submitted");
      const avg = submitted.length
        ? submitted.reduce((s, a) => s + Number(a.percentage || 0), 0) / submitted.length : 0;
      return {
        exams: exams.count ?? 0, qs: qs.count ?? 0,
        attempts: submitted.length, students: students.count ?? 0, avg,
      };
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Admin overview</h1>
      <p className="text-muted-foreground mt-1">Manage exams, questions, students, and view analytics.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Stat icon={BookOpen} label="Total exams" value={data?.exams ?? "—"} />
        <Stat icon={FileText} label="Total questions" value={data?.qs ?? "—"} />
        <Stat icon={Users} label="Students" value={data?.students ?? "—"} />
        <Stat icon={Trophy} label="Avg score" value={data ? `${data.avg.toFixed(1)}%` : "—"} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <Icon className="size-5 text-accent" />
      <div className="mt-3 text-3xl font-display font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
