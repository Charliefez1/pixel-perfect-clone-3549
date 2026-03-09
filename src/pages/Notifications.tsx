import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Notifications() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <>
      <PageHeader title="Notifications" searchPlaceholder="Search..." showFilter={false}>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} className="gap-2">
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </PageHeader>
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-4 max-w-3xl">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !notifications?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <p>No notifications yet.</p>
          </div>
        ) : (
          <Card className="max-w-3xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-3 rounded-lg transition-colors cursor-pointer ${
                      item.read ? "" : "bg-primary/5"
                    }`}
                    onClick={() => !item.read && markRead.mutate(item.id)}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.read ? "bg-transparent" : "bg-primary"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.message && <p className="text-sm text-muted-foreground mt-0.5">{item.message}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
