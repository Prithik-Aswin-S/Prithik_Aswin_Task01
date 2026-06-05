import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students — Admin" }] }),
  component: () => <Protected requireRole="admin"><AppShell><StudentsPage /></AppShell></Protected>,
});

function StudentsPage() {
  const { data } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: attempts } = await supabase.from("attempts").select("student_id,status");
      const counts: Record<string, number> = {};
      (attempts || []).forEach((a) => {
        if (a.status === "submitted") counts[a.student_id] = (counts[a.student_id] || 0) + 1;
      });
      return (profiles || []).map((p) => ({ ...p, attempts: counts[p.id] || 0 }));
    },
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Students</h1>
      <div className="mt-8 glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-muted-foreground">
            <tr><th className="text-left p-4">Name</th><th className="text-left p-4">Email</th><th className="text-right p-4">Attempts</th></tr>
          </thead>
          <tbody>
            {(data || []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4 text-muted-foreground">{s.email}</td>
                <td className="p-4 text-right font-display font-semibold">{s.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
