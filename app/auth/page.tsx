"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/app";
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Konto utworzone ✅ Teraz zaloguj się.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/app";
      }
    } catch (err: any) {
      setInfo(err?.message ?? "Coś poszło nie tak.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, border: "1px solid #ddd", borderRadius: 16, padding: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>nevermind</h1>
        <p style={{ marginTop: 0, marginBottom: 16, color: "#555" }}>
          Sign up & log in
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: "1px solid #ddd",
              background: mode === "signup" ? "#111" : "#fff",
              color: mode === "signup" ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: "1px solid #ddd",
              background: mode === "login" ? "#111" : "#fff",
              color: mode === "login" ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            Sign in 
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
          />
          <input
            placeholder="password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
          />

          <button
            disabled={loading}
            style={{
              padding: 10,
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Chwila..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        {info ? (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px solid #eee", background: "#fafafa" }}>
            {info}
          </div>
        ) : null}
      </div>
    </div>
  );
}
