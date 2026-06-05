import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — ExamFlow" }] }),
  component: () => <Protected><AppShell><ProfilePage /></AppShell></Protected>,
});

function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => { setName(data?.name ?? ""); setEmail(data?.email ?? user.email ?? ""); });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Invalid email"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ name, email }).eq("id", user!.id);
      if (error) throw error;
      if (email !== user!.email) {
        const { error: e2 } = await supabase.auth.updateUser({ email });
        if (e2) throw e2;
      }
      toast.success("Profile updated");
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password changed");
      setPassword(""); setConfirm("");
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Your profile</h1>
      <form onSubmit={saveProfile} className="glass-card rounded-2xl p-6 mt-8 space-y-4">
        <h2 className="font-display text-lg font-semibold">Account details</h2>
        <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}</Button>
      </form>
      <form onSubmit={changePassword} className="glass-card rounded-2xl p-6 mt-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Change password</h2>
        <div className="space-y-1.5"><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Confirm password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Update password"}</Button>
      </form>
    </div>
  );
}
