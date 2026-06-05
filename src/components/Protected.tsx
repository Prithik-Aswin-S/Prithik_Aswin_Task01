import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function Protected({ children, requireRole }: { children: ReactNode; requireRole?: Role }) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
    } else if (requireRole && role && role !== requireRole) {
      navigate({ to: role === "admin" ? "/admin" : "/dashboard" });
    }
  }, [user, role, loading, requireRole, navigate]);

  if (loading || !user || (requireRole && role !== requireRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
