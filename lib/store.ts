"use client";
import { useCallback, useEffect, useState } from "react";
import { DB } from "./types";
const DEFAULT_SETTINGS = { sleepStart: "23:30", sleepEnd: "06:30" };
export function normalize(d: Partial<DB>): DB {
  return { goals: d.goals ?? seedGoals(), tasks: d.tasks ?? [], blocks: d.blocks ?? [], logs: d.logs ?? [], sessions: d.sessions ?? [], settings: d.settings ?? DEFAULT_SETTINGS, exams: d.exams ?? seedExams(), topics: d.topics ?? [], mocks: d.mocks ?? [], mistakes: d.mistakes ?? [], reminders: d.reminders ?? [], opps: d.opps ?? [], reviews: d.reviews ?? [], leaks: d.leaks ?? [], achievements: d.achievements ?? [], projects: d.projects ?? [{ id: "p-synth", name: "Synth", description: "", goalId: "synth" }], milestones: d.milestones ?? [], leads: d.leads ?? [] };
}
import { seedExams, seedGoals } from "./seed";

const KEY = "lifeos:v1";
const subs = new Set<() => void>();
let cache: DB | null = null;

function read(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DB) : null;
    cache = parsed && Array.isArray(parsed.goals) && Array.isArray(parsed.tasks) ? normalize(parsed) : normalize({});
  } catch { cache = normalize({}); }
  return cache;
}
export const getDB = () => read();
export function replaceDB(next: DB) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { alert("Could not save: browser storage is full or blocked."); }
  subs.forEach((f) => f());
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function useDB(): [DB | null, (fn: (d: DB) => DB) => void] {
  const [db, setDb] = useState<DB | null>(null);
  useEffect(() => {
    const sync = () => setDb(read());
    sync(); subs.add(sync);
    return () => { subs.delete(sync); };
  }, []);
  const update = useCallback((fn: (d: DB) => DB) => replaceDB(fn(read())), []);
  return [db, update];
}
