import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  User,
  LogOut,
  Shield,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";
import { type ReactNode } from "react";
import { toast } from "sonner";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const studentNav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/exams", label: "Exams", icon: BookOpen },
    { to: "/results", label: "Results", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: User },
  ];
  const adminNav = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/exams", label: "Exams", icon: FileText },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/results", label: "Results", icon: BarChart3 },
  ];
  const nav = role === "admin" ? adminNav : studentNav;

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-xl gradient-primary grid place-items-center shadow-glow">
              <GraduationCap className="size-5 text-primary-foreground" />
            </div>
            <div className="font-display text-lg font-bold">ExamFlow</div>
          </Link>
          {role === "admin" && (
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent">
              <Shield className="size-3" /> Admin
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((item) => {
            const active = path === item.to || (item.to !== "/admin" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg gradient-primary grid place-items-center">
              <GraduationCap className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">ExamFlow</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="size-4" /></Button>
        </header>
        <div className="md:hidden flex overflow-x-auto gap-2 p-3 border-b border-border">
          {nav.map((item) => {
            const active = path === item.to;
            return (
              <Link key={item.to} to={item.to}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {item.label}
              </Link>
            );
          })}
        </div>
        {children}
      </main>
    </div>
  );
}
