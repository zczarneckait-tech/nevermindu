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
    // ✅ guard: only run in browser
    if (typeof window === "undefined") return;
    if (!userId) return;

    let active = true;

    try {
      const channel = supabase
        .channel(`notifications-live-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_user_id=eq.${userId}`,
          },
          (payload) => {
            if (!active) return;
            onNotify(payload.new as NotificationRow);
          }
        )
        .subscribe((status) => {
          // helpful for debugging
          // console.log("Realtime status:", status);
        });

      return () => {
        active = false;
        supabase.removeChannel(channel);
      };
    } catch (e) {
      // ✅ do not crash the whole app
      console.error("Notifications subscription error:", e);
      return;
    }
  }, [userId, onNotify]);
}
