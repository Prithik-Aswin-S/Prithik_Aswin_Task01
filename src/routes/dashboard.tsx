import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, BarChart3, User, Trophy, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ExamFlow" }] }),
  component: () => <Protected requireRole="student"><AppShell><DashboardPage /></AppShell></Protected>,
});

function DashboardPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["dash-stats", user?.id],
    queryFn: async () => {
      const [exams, attempts] = await Promise.all([
        supabase.from("exams").select("id", { count: "exact", head: true }),
        supabase.from("attempts").select("id,status").eq("student_id", user!.id),
      ]);
      const submitted = (attempts.data || []).filter((a) => a.status === "submitted").length;
      const inProgress = (attempts.data || []).filter((a) => a.status === "in_progress").length;
      return { totalExams: exams.count ?? 0, submitted, inProgress };
    },
    enabled: !!user,
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div>
        <div className="text-sm text-muted-foreground">Welcome back</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">
          Hello, <span className="text-gradient">{profile?.name || "student"}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <StatCard icon={BookOpen} label="Available exams" value={stats?.totalExams ?? "—"} tint="primary" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats?.submitted ?? "—"} tint="success" />
        <StatCard icon={Clock} label="In progress" value={stats?.inProgress ?? "—"} tint="accent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <ActionCard to="/exams" icon={BookOpen} title="Take an exam" desc="Browse available exams and begin." />
        <ActionCard to="/results" icon={BarChart3} title="View results" desc="See past attempts and scores." />
        <ActionCard to="/profile" icon={User} title="Edit profile" desc="Update name, email, or password." />
        <ActionCard to="/results" icon={Trophy} title="Leaderboard" desc="Coming soon — see top scorers." />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: any) {
  const tints: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    accent: "text-accent",
  };
  return (
    <div className="glass-card rounded-2xl p-5">
      <Icon className={`size-5 ${tints[tint]}`} />
      <div className="mt-3 text-3xl font-display font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionCard({ to, icon: Icon, title, desc }: any) {
  return (
    <Link to={to} className="glass-card rounded-2xl p-5 hover:border-primary/50 transition-colors group">
      <div className="size-10 rounded-xl gradient-primary grid place-items-center group-hover:shadow-glow transition-shadow">
        <Icon className="size-5 text-primary-foreground" />
      </div>
      <div className="mt-4 font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </Link>
  );
}
