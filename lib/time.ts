import { Block, DB } from "./types";
export const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const pad = (n: number) => String(n).padStart(2, "0");
export const fmt = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
export const dstr = (d: Date) => d.toLocaleDateString("en-CA");
export const parse = (s: string) => new Date(s + "T00:00:00");
export function blocksOn(db: DB, date: string): Block[] {
  const d = parse(date);
  return db.blocks.filter((b) => b.kind === "once" ? b.date === date : b.kind === "weekly" ? b.days.includes(d.getDay()) : b.monthDay === d.getDate())
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}
export function sleepRanges(db: DB): [number, number][] {
  const a = toMin(db.settings.sleepStart), b = toMin(db.settings.sleepEnd);
  return a > b ? [[a, 1440], [0, b]] : [[a, b]];
}
export const overlap = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;
