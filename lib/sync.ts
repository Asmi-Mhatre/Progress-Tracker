"use client";
import { supabase } from "./supabase";
import { DB } from "./types";
import { getDB, normalize, replaceDB } from "./store";

interface Meta { userId: string; version: number; hash: string }
const MK = "lifeos:sync";
export const hashOf = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
export const readMeta = (): Meta | null => { try { return JSON.parse(localStorage.getItem(MK) || "null"); } catch { return null; } };
const setMeta = (m: Meta) => { try { localStorage.setItem(MK, JSON.stringify(m)); } catch { /* ignore */ } };

let current: string | null = null; let email = ""; let status = "Not signed in";
const subs = new Set<() => void>();
const set = (s: string) => { status = s; subs.forEach((f) => f()); };
export const onStatus = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getStatus = () => ({ status, email, signedIn: !!current });
export const currentUser = () => current;
const pristine = (d: DB) => !(d.tasks.length || d.blocks.length || d.logs.length || d.sessions.length || d.topics.length || d.mocks.length || d.reminders.length || d.opps.length || d.reviews.length || d.milestones.length);

export async function setUser(id: string | null, mail = "") {
  if (id === current) return;
  current = id; email = mail;
  if (!id) return set("Not signed in");
  set("Syncing…"); await reconcile(id);
}
export async function push(userId: string, base: number | null): Promise<void> {
  if (!supabase) return;
  const local = getDB(), hash = hashOf(JSON.stringify(local)), now = new Date().toISOString();
  if (base === null) {
    const { error } = await supabase.from("user_data").insert({ user_id: userId, data: local, version: 1, updated_at: now });
    if (error) { if (error.code === "23505") return reconcile(userId); return set("Sync error: " + error.message); }
    setMeta({ userId, version: 1, hash });
  } else {
    const { data, error } = await supabase.from("user_data").update({ data: local, version: base + 1, updated_at: now }).eq("user_id", userId).eq("version", base).select("version");
    if (error) return set("Sync error: " + error.message);
    if (!data || data.length === 0) return reconcile(userId);
    setMeta({ userId, version: base + 1, hash });
  }
  set("Synced at " + new Date().toLocaleTimeString());
}
export async function reconcile(userId: string): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.from("user_data").select("data,version,updated_at").eq("user_id", userId).maybeSingle();
  if (error) return set("Sync error: " + error.message);
  if (!data) return push(userId, null);
  const m = readMeta(), local = getDB();
  if (m && m.userId === userId && m.version === data.version) {
    if (hashOf(JSON.stringify(local)) !== m.hash) return push(userId, data.version);
    return set("Synced");
  }
  const when = new Date(data.updated_at).toLocaleString();
  const takeCloud = pristine(local) || confirm(`The cloud copy (saved ${when}) differs from this device.\n\nOK = replace this device's data with the cloud copy.\nCancel = overwrite the cloud copy with this device's data.`);
  if (takeCloud) { replaceDB(normalize(data.data as Partial<DB>)); setMeta({ userId, version: data.version, hash: hashOf(JSON.stringify(getDB())) }); set("Loaded cloud data"); }
  else await push(userId, data.version);
}
