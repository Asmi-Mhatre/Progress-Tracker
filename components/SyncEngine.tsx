"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDB } from "@/lib/store";
import { currentUser, hashOf, push, readMeta, setUser } from "@/lib/sync";

export default function SyncEngine() {
  const [db] = useDB();
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user.id ?? null, data.session?.user.email ?? ""));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user.id ?? null, s?.user.email ?? ""); });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const u = currentUser(); const m = readMeta();
    if (!db || !u || !m || m.userId !== u || hashOf(JSON.stringify(db)) === m.hash) return;
    const t = setTimeout(() => { const mm = readMeta(); if (mm && mm.userId === u) push(u, mm.version); }, 3000);
    return () => clearTimeout(t);
  }, [db]);
  return null;
}
