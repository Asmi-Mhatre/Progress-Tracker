import { DB, Exam, Topic } from "./types";
import { blocksOn, dstr, parse, toMin } from "./time";

export const lastDays = (n: number, end = new Date()) => Array.from({ length: n }, (_, i) => { const d = new Date(end); d.setDate(d.getDate() - (n - 1 - i)); return dstr(d); });
const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
const add = (o: Record<string, number>, k: string, v: number) => { o[k] = (o[k] ?? 0) + v; };

// Actual time per goal per day = the larger of planner-logged minutes and focus-session minutes, so a focus session run inside a block is not counted twice.
export function dayStats(db: DB, date: string) {
  const planned: Record<string, number> = {}, logM: Record<string, number> = {}, ses: Record<string, number> = {}, actual: Record<string, number> = {};
  blocksOn(db, date).filter((b) => b.productive).forEach((b) => add(planned, b.goalId ?? "", b.durMin));
  db.logs.filter((l) => l.date === date).forEach((l) => { const b = db.blocks.find((x) => x.id === l.blockId); if (b?.productive) add(logM, b.goalId ?? "", l.actualMin); });
  db.sessions.filter((s) => s.date === date).forEach((s) => add(ses, s.goalId ?? "", s.actualMin));
  new Set([...Object.keys(logM), ...Object.keys(ses)]).forEach((k) => { actual[k] = Math.max(logM[k] ?? 0, ses[k] ?? 0); });
  return { planned, actual, plannedTotal: sum(planned), actualTotal: sum(actual) };
}
export function rangeStats(db: DB, dates: string[]) {
  const planned: Record<string, number> = {}, actual: Record<string, number> = {};
  const days = dates.map((date) => { const s = dayStats(db, date); Object.entries(s.planned).forEach(([k, v]) => add(planned, k, v)); Object.entries(s.actual).forEach(([k, v]) => add(actual, k, v));
    return { date, plannedTotal: s.plannedTotal, actualTotal: s.actualTotal, score: s.plannedTotal ? Math.min(100, Math.round((s.actualTotal / s.plannedTotal) * 100)) : undefined }; });
  return { planned, actual, days, plannedTotal: sum(planned), actualTotal: sum(actual) };
}
export function shares(db: DB, actual: Record<string, number>) {
  const goals = db.goals.filter((g) => g.status === "active"), tw = goals.reduce((s, g) => s + g.weight, 0) || 1, ta = sum(actual);
  return { ta, rows: goals.map((g) => ({ g, intended: g.weight / tw, actual: ta ? (actual[g.id] ?? 0) / ta : 0, min: actual[g.id] ?? 0 })) };
}
export function alignment(db: DB, actual: Record<string, number>): number | null {
  const { ta, rows } = shares(db, actual); if (ta < 120) return null;
  const linked = rows.reduce((s, r) => s + r.actual, 0);
  return Math.round((1 - 0.5 * (rows.reduce((s, r) => s + Math.abs(r.intended - r.actual), 0) + (1 - linked))) * 100);
}
export function neglected(db: DB, actual: Record<string, number>) {
  const { ta, rows } = shares(db, actual);
  return rows.filter((r) => r.g.weight >= 4 && (r.min === 0 || (ta >= 120 && r.actual < r.intended * 0.5))).map((r) => ({ name: r.g.name, weight: r.g.weight, min: r.min, none: r.min === 0 }));
}
export function streak(db: DB) {
  let n = 0; const days = lastDays(60).reverse(), today = dstr(new Date());
  for (const d of days) { const s = dayStats(db, d); const ok = s.plannedTotal > 0 && s.actualTotal >= s.plannedTotal * 0.8;
    if (ok) n++; else if (d !== today) break; }
  return n;
}
export function examRisk(e: Exam, topics: Topic[], today: string) {
  const parents = new Set(topics.map((t) => t.parentId)), leaves = topics.filter((t) => !parents.has(t.id)), rem = leaves.filter((t) => !t.done).length;
  if (!e.examDate || !leaves.length || rem === 0) return null;
  const left = Math.round((parse(e.examDate).getTime() - parse(today).getTime()) / 864e5); if (left <= 0) return null;
  const need = rem / (left / 7), pace = leaves.filter((t) => t.doneAt && Math.round((parse(t.doneAt).getTime() - parse(today).getTime()) / 864e5) >= -14).length / 2;
  return pace < need ? { name: e.name, need, pace, rem, left } : null;
}
export function missed(db: DB, dates: string[]) {
  const now = new Date(), nm = now.getHours() * 60 + now.getMinutes(), today = dstr(now), by: Record<string, number> = {};
  dates.forEach((d) => blocksOn(db, d).filter((b) => b.productive).forEach((b) => { const ended = d < today || (d === today && toMin(b.start) + b.durMin <= nm); if (!ended) return;
    const l = db.logs.find((x) => x.blockId === b.id && x.date === d); if (!l || l.status === "skipped") add(by, b.title, 1); }));
  return Object.entries(by).sort((a, b) => b[1] - a[1]);
}
export const goalName = (db: DB, id: string) => (id ? db.goals.find((g) => g.id === id)?.name ?? "Deleted goal" : "No goal");
