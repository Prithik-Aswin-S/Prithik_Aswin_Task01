import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, Timer, ShieldCheck, BarChart3, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ExamFlow — Modern Online Examination System" },
      { name: "description", content: "A modern online examination platform for colleges: timed MCQ exams, instant results, and admin analytics." },
      { property: "og:title", content: "ExamFlow — Modern Online Examination System" },
      { property: "og:description", content: "Timed MCQ exams, instant results, and admin analytics." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: role === "admin" ? "/admin" : "/dashboard" });
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl gradient-primary grid place-items-center shadow-glow">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">ExamFlow</span>
        </div>
        <div className="flex gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button>Get started</Button></Link>
        </div>
      </nav>

      <section className="px-6 md:px-12 py-16 md:py-28 max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full glass-card px-3 py-1 text-xs">
          <Sparkles className="size-3 text-accent" /> Built for modern classrooms
        </div>
        <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold leading-[1.05]">
          Examinations,<br /> <span className="text-gradient">reimagined.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A focused, distraction-free MCQ platform with live timers, auto-submit,
          and instant analytics — for students and administrators alike.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/auth"><Button size="lg" className="gap-2">Start now <ArrowRight className="size-4" /></Button></Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-4">
          {[
            { icon: Timer, title: "Live timers", desc: "HH:MM:SS countdown with smart warnings and auto-submit." },
            { icon: ShieldCheck, title: "Secure sessions", desc: "Role-based access for students and administrators." },
            { icon: BarChart3, title: "Instant analytics", desc: "Beautiful results, pass/fail status, and history." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <f.icon className="size-6 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
