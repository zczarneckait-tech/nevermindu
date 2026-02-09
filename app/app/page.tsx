"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Category = { id: string; title: string; created_at: string };
type Message = { id: string; content: string; created_at: string; category_id: string };

export default function AppPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [draft, setDraft] = useState("");

  // Messenger-like sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? null,
    [categories, activeCategoryId]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      if (!uid) {
        window.location.href = "/auth";
        return;
      }
      setUserId(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = "/auth";
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) return alert(error.message);

      const cats = (data ?? []) as Category[];
      setCategories(cats);
      if (cats.length > 0) setActiveCategoryId((prev) => prev ?? cats[0].id);
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId || !activeCategoryId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("category_id", activeCategoryId)
        .order("created_at", { ascending: true });

      if (error) return alert(error.message);
      setMessages((data ?? []) as Message[]);
    })();
  }, [userId, activeCategoryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeCategoryId]);

  async function addCategory() {
    const title = newCategoryTitle.trim();
    if (!title) return;

    const { data, error } = await supabase
      .from("categories")
      .insert({ title, user_id: userId })
      .select()
      .single();

    if (error) return alert(error.message);

    const c = data as Category;
    setCategories((prev) => [...prev, c]);
    setNewCategoryTitle("");
    setActiveCategoryId(c.id);
    setSidebarOpen(false); // nice on mobile
  }

  async function deleteCategory(categoryId: string) {
    const c = categories.find((x) => x.id === categoryId);
    const ok = window.confirm(`Delete this chat/category:\n"${c?.title ?? "Untitled"}"?\n\nThis will also delete all messages inside.`);
    if (!ok) return;

    // Optimistic UI
    const prevCategories = categories;
    const prevActive = activeCategoryId;
    setCategories((prev) => prev.filter((x) => x.id !== categoryId));
    if (prevActive === categoryId) {
      const remaining = prevCategories.filter((x) => x.id !== categoryId);
      setActiveCategoryId(remaining[0]?.id ?? null);
      setMessages([]);
    }

    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    if (error) {
      alert(error.message);
      // rollback
      setCategories(prevCategories);
      setActiveCategoryId(prevActive);
    }
  }

  async function sendFake() {
    const content = draft.trim();
    if (!content || !activeCategoryId) return;

    setDraft("");

    const optimistic: Message = {
      id: "optimistic-" + Math.random().toString(16).slice(2),
      content,
      category_id: activeCategoryId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("messages")
      .insert({ content, category_id: activeCategoryId, user_id: userId })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert(error.message);
      return;
    }

    setMessages((prev) => {
      const next = prev.slice(0, -1);
      return [...next, data as Message];
    });
  }

  async function deleteMessage(messageId: string) {
    const ok = window.confirm("Delete this message?");
    if (!ok) return;

    const prev = messages;
    setMessages((p) => p.filter((m) => m.id !== messageId));

    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      alert(error.message);
      setMessages(prev); // rollback
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }
  async function publishMessage(content: string) {
  const ok = window.confirm(
    "Publish this message to the public map?\n\nYour location will be approximate (not exact)."
  );
  if (!ok) return;

  // geolokalizacja z przeglądarki
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
    });
  });

  // zaokrąglenie dla prywatności:
  // 2 miejsca po przecinku ~ 1 km, 1 miejsce ~ 11 km
  const lat = Math.round(pos.coords.latitude * 100) / 100;
  const lng = Math.round(pos.coords.longitude * 100) / 100;

  const city = prompt("City name (optional):", "") || null;

  const { error } = await supabase.from("public_posts").insert({
    user_id: userId,
    content,
    city,
    lat,
    lng,
  });

  if (error) alert(error.message);
  else alert("Published ✅");
}


  return (
    <div className="min-h-screen bg-[#FBF6EF] text-[#2B1E16]">
      <div className="max-w-6xl mx-auto p-5">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle (mobile) */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="md:hidden rounded-2xl px-3 py-2 border border-[#E7D9CC] bg-white/70 hover:bg-white transition shadow-sm"
              aria-label="Toggle chats"
              title="Chats"
            >
              ☰
            </button>

            <div>
              <h1 className="text-2xl font-bold">Your emotional chats</h1>
              <p className="text-sm opacity-80">Write. “Send”. Come back whenever you want.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
  <Link
    href="/public"
    className="rounded-2xl px-4 py-2 text-sm border border-[#E7D9CC] bg-white/80 hover:bg-white"
  >
    Mind Map
  </Link>

  <button
    onClick={logout}
    className="rounded-2xl px-4 py-2 text-sm border border-[#E7D9CC]"
  >
    Log out
  </button>
</div>

          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <button
              className="md:hidden fixed inset-0 bg-black/20 z-30"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar overlay"
            />
          )}

          {/* Sidebar */}
          <aside
            className={[
              "md:col-span-4 rounded-[28px] bg-white/70 border border-[#E7D9CC] shadow-sm overflow-hidden z-40",
              // mobile slide-in
              "md:static md:translate-x-0 md:opacity-100 md:pointer-events-auto",
              "fixed top-0 left-0 h-full w-[86%] max-w-sm p-0",
              sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[110%] opacity-100",
              "transition-transform duration-200",
            ].join(" ")}
          >
            <div className="p-4 border-b border-[#E7D9CC] bg-white/40">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">Chats</div>
                <button
                  className="md:hidden rounded-2xl px-3 py-1.5 border border-[#E7D9CC] bg-white/70 hover:bg-white transition"
                  onClick={() => setSidebarOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <input
                  className="flex-1 rounded-2xl px-4 py-2 border border-[#E7D9CC] bg-white outline-none focus:ring-2 focus:ring-[#D7BBAA]"
                  placeholder="New category (e.g. longing)"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <button
                  className="rounded-2xl px-4 py-2 bg-[#6B4632] text-white hover:bg-[#5A3B2A] transition shadow-sm"
                  onClick={addCategory}
                  title="Add"
                >
                  +
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-140px)] md:max-h-[70vh] overflow-auto p-2">
              {categories.length === 0 ? (
                <div className="p-3 text-sm opacity-80">
                  Create your first category — this will be your first “chat”.
                </div>
              ) : (
                <ul>
                  {categories.map((c) => {
                    const active = c.id === activeCategoryId;
                    return (
                      <li key={c.id} className="mb-2">
                        <div
                          className={[
                            "w-full px-4 py-3 rounded-2xl border transition flex items-start justify-between gap-3",
                            active
                              ? "bg-[#F3E7DD] border-[#D7BBAA]"
                              : "bg-white/60 border-[#E7D9CC] hover:bg-white",
                          ].join(" ")}
                        >
                          <button
                            onClick={() => {
                              setActiveCategoryId(c.id);
                              setSidebarOpen(false);
                            }}
                            className="text-left flex-1"
                          >
                            <div className="font-bold">{c.title}</div>
                            <div className="text-xs opacity-70">Your space for words.</div>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCategory(c.id);
                            }}
                            className="shrink-0 rounded-2xl px-3 py-1.5 text-sm border border-[#E7D9CC] bg-white/70 hover:bg-white transition"
                            title="Delete chat"
                            aria-label="Delete chat"
                          >
                            🗑️
                          </button>
                         
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Chat */}
          <main className="md:col-span-8 rounded-[28px] bg-white/70 border border-[#E7D9CC] shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#E7D9CC] bg-white/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm opacity-70">Chat</div>
                <div className="text-xl font-bold">
                  {activeCategory ? activeCategory.title : "Choose a category"}
                </div>
              </div>

              {/* Quick open chats button (desktop optional, but nice) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden rounded-2xl px-3 py-2 text-sm border border-[#E7D9CC] bg-white/70 hover:bg-white transition"
              >
                Chats
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto space-y-3">
              {activeCategoryId && messages.length === 0 ? (
                <div className="text-sm opacity-80">
                  Write your first message. No one receives it — this space is yours.
                </div>
              ) : null}

              {messages.map((m) => (
  <div key={m.id} className="flex justify-end group relative pl-20">
    <div className="max-w-[85%] rounded-[22px] bg-[#6B4632] text-white px-4 py-3 shadow-sm">
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {m.content}
      </div>
      <div className="mt-1 text-[11px] opacity-80">
        {new Date(m.created_at).toLocaleString()}
      </div>
    </div>

    {/* icons column */}
    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={() => publishMessage(m.content)}
        className="rounded-2xl px-2 py-1 text-xs border border-[#E7D9CC] bg-white/80 hover:bg-white shadow-sm"
        title="Publish to map"
      >
        🌍
      </button>

      <button
        onClick={() => deleteMessage(m.id)}
        className="rounded-2xl px-2 py-1 text-xs border border-[#E7D9CC] bg-white/80 hover:bg-white shadow-sm"
        title="Delete message"
        aria-label="Delete message"
      >
        🗑️
      </button>
    </div>
  </div>
))}


              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-[#E7D9CC] bg-white/40">
              <div className="flex gap-3 items-end">
                <textarea
                  className="flex-1 resize-none rounded-2xl px-4 py-3 border border-[#E7D9CC] bg-white outline-none focus:ring-2 focus:ring-[#D7BBAA] min-h-[52px] max-h-[160px]"
                  placeholder="Write a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendFake();
                    }
                  }}
                  disabled={!activeCategoryId}
                />
                <button
                  onClick={sendFake}
                  disabled={!activeCategoryId}
                  className="rounded-2xl px-5 py-3 bg-[#6B4632] text-white hover:bg-[#5A3B2A] transition disabled:opacity-60 shadow-sm"
                  title="Send (just for you)"
                >
                  Send
                </button>
              </div>
              <div className="mt-2 text-xs opacity-70">Enter = send • Shift+Enter = new line</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
