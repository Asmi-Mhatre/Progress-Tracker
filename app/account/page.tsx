"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { currentUser, getStatus, onStatus, push, reconcile, readMeta } from "@/lib/sync";

export default function Account() {
  const [, tick] = useState(0); const [em, setEm] = useState(""); const [pw, setPw] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => onStatus(() => tick((n) => n + 1)), []);
  const s = getStatus();
  if (!supabase) return (
    <div className="space-y-3"><h1 className="text-2xl font-semibold">Account & Sync</h1>
      <p className="card p-5 text-sm">Cloud sync is off, so your data lives only in this browser. To enable it, create a Supabase project, run <code>supabase/schema.sql</code>, and set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. See the README.</p></div>);
  const auth = async (mode: "in" | "up") => {
    if (!em.includes("@") || pw.length < 8) return setMsg("Enter a valid email and a password of at least 8 characters.");
    setBusy(true); setMsg("");
    const r = mode === "in" ? await supabase!.auth.signInWithPassword({ email: em, password: pw }) : await supabase!.auth.signUp({ email: em, password: pw });
    setBusy(false);
    if (r.error) setMsg(r.error.message); else if (mode === "up" && !r.data.session) setMsg("Check your email to confirm the account, then sign in.");
  };
  const u = currentUser();
  return (
    <div className="space-y-4"><h1 className="text-2xl font-semibold">Account & Sync</h1>
      <section className="card max-w-md space-y-3 p-5">
        {s.signedIn ? <>
          <p className="text-sm">Signed in as <b>{s.email}</b></p><p className="text-sm text-mute">{s.status}</p>
          <div className="flex gap-2"><button className="btn btn-primary" onClick={() => { const m = readMeta(); if (u) m && m.userId === u ? push(u, m.version) : reconcile(u); }}>Sync now</button>
            <button className="btn" onClick={() => supabase!.auth.signOut()}>Sign out</button></div>
          <p className="text-xs text-mute">Changes upload a few seconds after you make them. The whole data set is one record: if two devices edit between syncs, you are asked which copy to keep. Signing out leaves this device's data in place.</p></>
        : <>
          <input className="input" type="email" placeholder="Email" value={em} onChange={(e) => setEm(e.target.value)} autoComplete="email" />
          <input className="input" type="password" placeholder="Password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          <div className="flex gap-2"><button className="btn btn-primary" disabled={busy} onClick={() => auth("in")}>Sign in</button><button className="btn" disabled={busy} onClick={() => auth("up")}>Create account</button></div></>}
        {msg && <p className="text-sm text-warn">{msg}</p>}
      </section></div>
  );
}
