"use client";
import { useState } from "react";
import { useDB } from "@/lib/store";
import { blocksOn, dstr } from "@/lib/time";

export default function CalendarPage() {
  const [db] = useDB();
  const [m, setM] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [sel, setSel] = useState(dstr(new Date()));
  if (!db) return <p className="text-mute">Loading…</p>;
  const y = m.getFullYear(), mo = m.getMonth();
  const days = new Date(y, mo + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(m.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => dstr(new Date(y, mo, i + 1)))];
  const info = (ds: string) => ({ due: db.tasks.filter((t) => !t.done && t.due === ds).length, blocks: blocksOn(db, ds).length,
    min: db.logs.filter((l) => l.date === ds).reduce((s, l) => s + l.actualMin, 0) });
  const shift = (n: number) => setM(new Date(y, mo + n, 1));
  const day = info(sel);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{m.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h1>
        <div className="flex gap-2"><button className="btn" onClick={() => shift(-1)}>Previous</button><button className="btn" onClick={() => shift(1)}>Next</button></div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-mute">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((ds, i) => { if (!ds) return <div key={i} />; const n = info(ds);
          return (
            <button key={ds} onClick={() => setSel(ds)} className={`card min-h-16 p-1.5 text-left text-xs ${sel === ds ? "border-accent" : ""} ${ds === dstr(new Date()) ? "font-semibold" : ""}`}>
              <div>{Number(ds.slice(8))}</div>
              {n.due > 0 && <div className="text-warn">{n.due} due</div>}
              {n.min > 0 && <div className="text-accent">{(n.min / 60).toFixed(1)} h</div>}
            </button>); })}
      </div>
      <section className="card space-y-2 p-5">
        <h2 className="font-medium">{sel}</h2>
        <p className="text-sm text-mute">{day.blocks} scheduled block{day.blocks === 1 ? "" : "s"} · {(day.min / 60).toFixed(1)} h logged</p>
        {db.tasks.filter((t) => t.due === sel).map((t) => <div key={t.id} className={`text-sm ${t.done ? "text-mute line-through" : ""}`}>{t.title}</div>)}
        {db.reminders.filter((r) => r.dueAt.slice(0, 10) === sel).map((r) => <div key={r.id} className={`text-sm ${r.done ? "text-mute line-through" : "text-warn"}`}>Deadline {r.dueAt.slice(11)} {r.title}</div>)}
        {blocksOn(db, sel).map((b) => <div key={b.id} className="text-sm">{b.start} {b.title} <span className="text-mute">({b.durMin} min)</span></div>)}
      </section>
    </div>
  );
}
