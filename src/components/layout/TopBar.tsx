import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: unreadCount = 0, refetch } = useQuery({
    queryKey: ["unread_notifications_count"],
    queryFn: async () => {
      if (!session?.user?.id) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!session?.user?.id,
    refetchInterval: 30000,
  });

  // Realtime subscription for instant updates
  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel("notifications-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, refetch]);

  return (
    <header className="h-14 border-b border-border bg-background-elevated flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-section-title">{title}</h1>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => navigate("/notifications")}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            CW
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
