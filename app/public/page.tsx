"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import Link from "next/link";



type PublicPost = {
  id: string;
  content: string;
  city: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

const MapView = dynamic(() => import("../components/_MapView"), { ssr: false });

export default function PublicPage() {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("public_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (!error && data) setPosts(data as PublicPost[]);
      setLoading(false);
    })();
  }, []);

  const center = useMemo<[number, number]>(() => {
    // jeśli są posty, wycentruj mniej więcej na ostatnim; jak nie, Europa
    if (posts.length > 0) return [posts[0].lat, posts[0].lng];
    return [52.2297, 21.0122]; // Warsaw fallback
  }, [posts]);


  return (
    <div className="min-h-screen bg-[#FBF6EF] text-[#2B1E16]">
      <div className="max-w-6xl mx-auto p-5">
        <Link
  href="/"
  className="inline-flex mb-4 rounded-2xl px-4 py-2 text-sm border border-[#E7D9CC] bg-white/80 hover:bg-white"
>
  ← Back to chats
</Link>

        <div className="mb-4">
          <h1 className="text-2xl font-bold">Public map</h1>
          <p className="text-sm opacity-80">
            Anonymous thoughts pinned to places (approximate location).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-[28px] bg-white/70 border border-[#E7D9CC] shadow-sm overflow-hidden">
            <MapView center={center} posts={posts} />
          </div>

          <div className="lg:col-span-5 rounded-[28px] bg-white/70 border border-[#E7D9CC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E7D9CC] bg-white/40">
              <div className="font-bold">Latest pins</div>
              <div className="text-xs opacity-70">{loading ? "Loading..." : `${posts.length} posts`}</div>
            </div>

            <div className="max-h-[70vh] overflow-auto p-3 space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="rounded-2xl border border-[#E7D9CC] bg-white/60 p-3">
                  <div className="text-xs opacity-70">{p.city ?? "Unknown city"} • {new Date(p.created_at).toLocaleString()}</div>
                  <div className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">{p.content}</div>
                </div>
              ))}

              {!loading && posts.length === 0 && (
                <div className="p-3 text-sm opacity-80">
                  No public posts yet. Be the first one ✨
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
