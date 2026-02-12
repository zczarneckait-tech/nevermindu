import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type NotificationRow = {
  id: string;
  recipient_user_id: string;
  from_message_id: string;
  from_user_id: string;
  distance_km: number;
  similarity: number;
  preview: string;
  created_at: string;
  read_at: string | null;
};

export function useNearbySimilarNotifications(
  userId: string | null,
  onNotify: (n: NotificationRow) => void
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          onNotify(payload.new as NotificationRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNotify]);
}
