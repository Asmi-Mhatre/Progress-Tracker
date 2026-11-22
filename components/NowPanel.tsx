"use client";
import Link from "next/link";
import { DB } from "@/lib/types";
import { blocksOn, dstr, fmt, toMin } from "@/lib/time";
import { uid } from "@/lib/store";

export default function NowPanel({ db, update, now }: { db: DB; update: (f: (d: DB) => DB) => void; now: Date }) {
  const date = dstr(now), nm = now.getHours() * 60 + now.getMinutes();
  const bs = blocksOn(db, date);
  const logged = (id: string) => db.logs.some((l) => l.blockId === id && l.date === date);
  const cur = bs.find((b) => toMin(b.start) <= nm && nm < toMin(b.start) + b.durMin);
  const next = bs.find((b) => toMin(b.start) > nm);
  const behind = bs.filter((b) => b.productive && toMin(b.start) + b.durMin <= nm && !logged(b.id)).length;
  const goal = (id?: string) => db.goals.find((g) => g.id === id)?.name ?? "No goal";
  const complete = () => cur && update((d) => ({ ...d, logs: [...d.logs, { id: uid(), blockId: cur.id, date, status: "done", actualMin: cur.durMin, notes: "" }] }));
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-medium">What should I be doing now?</h2>
      {behind > 0 && <p className="mb-3 text-sm text-warn">{behind} earlier block{behind > 1 ? "s are" : " is"} not logged yet. Log or reschedule in the Daily Planner.</p>}
      {cur ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">{cur.title}</div>
            <div className="text-sm text-mute">{goal(cur.goalId)} · {cur.start}–{fmt(toMin(cur.start) + cur.durMin)} · {toMin(cur.start) + cur.durMin - nm} min left · {cur.fixed ? "fixed" : "flexible"}</div>
          </div>
          <div className="flex gap-2">
            <Link className="btn btn-primary" href="/focus">Start focus</Link>
            <button className="btn" disabled={logged(cur.id)} onClick={complete}>{logged(cur.id) ? "Logged" : "Complete"}</button>
          </div>
        </div>
      ) : <p className="text-mute">{bs.length === 0 ? "No blocks scheduled today. Add some in the Daily Planner." : next ? `Free now. Next: ${next.title} at ${next.start}.` : "No more blocks today."}</p>}
    </section>
  );
}
