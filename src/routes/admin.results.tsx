import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/results")({
  head: () => ({ meta: [{ title: "Results — Admin" }] }),
  component: () => <Protected requireRole="admin"><AppShell><AdminResults /></AppShell></Protected>,
});

function AdminResults() {
  const { data } = useQuery({
    queryKey: ["admin-results"],
    queryFn: async () => {
      const { data: attempts } = await supabase
        .from("attempts")
        .select("*, exams(title,subject)")
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false });
      const ids = Array.from(new Set((attempts || []).map((a: any) => a.student_id)));
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id,name,email").in("id", ids)
        : { data: [] as any[] };
      const pmap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { pmap[p.id] = p; });
      const enriched = (attempts || []).map((a: any) => ({ ...a, profile: pmap[a.student_id] }));

      const byExam: Record<string, { title: string; total: number; sum: number }> = {};
      enriched.forEach((a: any) => {
        const t = a.exams?.title || "Unknown";
        if (!byExam[t]) byExam[t] = { title: t, total: 0, sum: 0 };
        byExam[t].total++;
        byExam[t].sum += Number(a.percentage || 0);
      });
      const chart = Object.values(byExam).map((e) => ({ title: e.title, avg: Number((e.sum / e.total).toFixed(1)) }));
      return { attempts: enriched, chart };
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Results & analytics</h1>

      <div className="glass-card rounded-2xl p-6 mt-8">
        <h2 className="font-display text-lg font-semibold mb-4">Average score by exam</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={data?.chart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.025 260)" />
              <XAxis dataKey="title" stroke="oklch(0.72 0.02 260)" fontSize={11} />
              <YAxis stroke="oklch(0.72 0.02 260)" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.025 260)", border: "1px solid oklch(0.3 0.02 260)", borderRadius: 8 }} />
              <Bar dataKey="avg" fill="oklch(0.62 0.19 256)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr>
              <th className="text-left p-4">Student</th>
              <th className="text-left p-4">Exam</th>
              <th className="text-right p-4">Score</th>
              <th className="text-right p-4">%</th>
              <th className="text-right p-4">When</th>
            </tr>
          </thead>
          <tbody>
            {(data?.attempts || []).map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-4">
                  <div className="font-medium">{a.profile?.name}</div>
                  <div className="text-xs text-muted-foreground">{a.profile?.email}</div>
                </td>
                <td className="p-4">{a.exams?.title}</td>
                <td className="p-4 text-right font-display">{a.score}/{a.total}</td>
                <td className="p-4 text-right font-display font-semibold">{Number(a.percentage || 0).toFixed(0)}%</td>
                <td className="p-4 text-right text-xs text-muted-foreground">{new Date(a.submitted_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
