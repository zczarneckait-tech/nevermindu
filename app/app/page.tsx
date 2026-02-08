"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = { id: string; title: string; created_at: string };
type Message = { id: string; content: string; created_at: string; category_id: string };

export default function AppPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [draft, setDraft] = useState("");

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

      if (!error && data) {
        const cats = data as Category[];
        setCategories(cats);
        if (cats.length > 0) setActiveCategoryId(cats[0].id);
      } else if (error) {
        alert(error.message);
      }
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

      if (!error && data) setMessages(data as Message[]);
      else if (error) alert(error.message);
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

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <div className="min-h-screen bg-[#FBF6EF] text-[#2B1E16]">
      <div className="max-w-6xl mx-auto p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Twoje czaty z uczuciami</h1>
            <p className="text-sm opacity-80">Pisz, “wyślij”, wracaj kiedy chcesz.</p>
          </div>

          <button
            onClick={logout}
            className="rounded-2xl px-4 py-2 text-sm border border-[#E7D9CC] bg-white/70 hover:bg-white transition shadow-sm"
          >
            Wyloguj
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* LEFT: categories */}
          <aside className="md:col-span-4 rounded-[28px] bg-white/70 border border-[#E7D9CC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E7D9CC] bg-white/40">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-2xl px-4 py-2 border border-[#E7D9CC] bg-white outline-none focus:ring-2 focus:ring-[#D7BBAA]"
                  placeholder="Nowa kategoria (np. tęsknota)"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <button
                  className="rounded-2xl px-4 py-2 bg-[#6B4632] text-white hover:bg-[#5A3B2A] transition shadow-sm"
                  onClick={addCategory}
                  title="Dodaj"
                >
                  +
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              {categories.length === 0 ? (
                <div className="p-4 text-sm opacity-80">
                  Zrób pierwszą kategorię (to będzie Twój pierwszy “czat”).
                </div>
              ) : (
                <ul className="p-2">
                  {categories.map((c) => {
                    const active = c.id === activeCategoryId;
                    return (
                      <li key={c.id} className="mb-2">
                        <button
                          onClick={() => setActiveCategoryId(c.id)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                            active
                              ? "bg-[#F3E7DD] border-[#D7BBAA]"
                              : "bg-white/60 border-[#E7D9CC] hover:bg-white"
                          }`}
                        >
                          <div className="font-bold">{c.title}</div>
                          <div className="text-xs opacity-70">Twoje miejsce na słowa.</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* RIGHT: chat */}
          <main className="md:col-span-8 rounded-[28px] bg-white/70 border border-[#E7D9CC] shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#E7D9CC] bg-white/40">
              <div className="text-sm opacity-70">Czat</div>
              <div className="text-xl font-bold">{activeCategory ? activeCategory.title : "Wybierz kategorię"}</div>
            </div>

            <div className="flex-1 p-4 overflow-auto space-y-3">
              {activeCategoryId && messages.length === 0 ? (
                <div className="text-sm opacity-80">
                  Napisz pierwszą wiadomość. Nikt jej nie dostaje — to Twoja przestrzeń.
                </div>
              ) : null}

              {messages.map((m) => (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-[22px] bg-[#6B4632] text-white px-4 py-3 shadow-sm">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    <div className="mt-1 text-[11px] opacity-80">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-[#E7D9CC] bg-white/40">
              <div className="flex gap-3 items-end">
                <textarea
                  className="flex-1 resize-none rounded-2xl px-4 py-3 border border-[#E7D9CC] bg-white outline-none focus:ring-2 focus:ring-[#D7BBAA] min-h-[52px] max-h-[160px]"
                  placeholder="Napisz wiadomość..."
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
                  title="Wyślij na niby"
                >
                  Wyślij
                </button>
              </div>
              <div className="mt-2 text-xs opacity-70">
                Enter = wyślij • Shift+Enter = nowa linia
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
