import { DB, Reminder } from "./types";
const p2 = (n: number) => String(n).padStart(2, "0");
export const toInput = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
export function triggerAt(r: Reminder, off: number): number {
  const d = new Date(r.dueAt);
  return off === 0 ? d.getTime() : new Date(d.getFullYear(), d.getMonth(), d.getDate() - off, 9, 0).getTime();
}
export function nextDue(r: Reminder, now: number): string {
  const d = new Date(r.dueAt);
  do { if (r.recur === "weekly") d.setDate(d.getDate() + 7); else if (r.recur === "monthly") d.setMonth(d.getMonth() + 1); else d.setFullYear(d.getFullYear() + 1); } while (d.getTime() <= now);
  return toInput(d);
}
export function countdown(dueAt: string, now: number): string {
  const ms = new Date(dueAt).getTime() - now, d = Math.floor(Math.abs(ms) / 864e5), h = Math.floor((Math.abs(ms) % 864e5) / 36e5);
  return ms < 0 ? `overdue by ${d ? d + " d" : h + " h"}` : d ? `in ${d} d` : `in ${h} h`;
}
export const activeAlerts = (db: DB, now: number) => db.reminders.filter((r) => !r.done && r.offsets.some((o) => triggerAt(r, o) <= now)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
