"use client";
import { useState } from "react";
import { DB } from "@/lib/types";
import { uid } from "@/lib/store";

export default function MvdPanel({ db, update, today }: { db: DB; update: (f: (d: DB) => DB) => void; today: string }) {
  const [open, setOpen] = useState(false);
  const items = db.settings.mvd ?? [];
  const done = (t: string) => db.sessions.some((s) => s.date === today && s.notes === `MVD: ${t}`);
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between"><h2 className="font-medium">Minimum viable day</h2><button className="btn" onClick={() => setOpen(!open)}>{open ? "Hide" : "Hard day"}</button></div>
      {open && (items.length === 0 ? <p className="mt-2 text-sm text-mute">No fallback routine yet. Define one in Settings.</p> : (
        <ul className="mt-2 space-y-1 text-sm">{items.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2"><span>{m.title} · {m.min} min</span>
            <button className="btn py-0.5" disabled={done(m.title)} onClick={() => update((d) => ({ ...d, sessions: [...d.sessions, { id: uid(), goalId: m.goalId, date: today, plannedMin: m.min, actualMin: m.min, distractions: 0, completed: true, notes: `MVD: ${m.title}` }] }))}>{done(m.title) ? "Done" : "Log done"}</button></li>))}</ul>))}
    </section>
  );
}
