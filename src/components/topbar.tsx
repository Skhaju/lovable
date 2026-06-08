import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "@tanstack/react-router";

export function TopBar({ title }: { title: string }) {
  const [now, setNow] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  const logout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="h-6 w-px bg-border" />
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden text-xs text-muted-foreground md:inline">{now}</span>
        <button className="rounded-md p-2 text-muted-foreground hover:bg-muted">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-3 w-3" />
          </div>
          <div className="text-xs">
            <div className="font-medium truncate max-w-[140px]">{user?.email ?? "Guest"}</div>
            <div className="text-muted-foreground">Staff</div>
          </div>
        </div>
        <button onClick={logout} title="Sign out" className="rounded-md p-2 text-muted-foreground hover:bg-muted">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}