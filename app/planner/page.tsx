"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";
import { blocksOn, dstr, fmt, overlap, parse, sleepRanges, toMin } from "@/lib/time";
import { Block, DB, Log } from "@/lib/types";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PX = 22;
type Upd = (f: (d: DB) => DB) => void;

function Row({ b, date, db, update }: { b: Block; date: string; db: DB; update: Upd }) {
  const log = db.logs.find((l) => l.blockId === b.id && l.date === date);
  const [min, setMin] = useState(b.durMin); const [note, setNote] = useState("");
  const patch = (p: Partial<Block>) => update((d) => ({ ...d, blocks: d.blocks.map((x) => (x.id === b.id ? { ...x, ...p } : x)) }));
  const setLog = (status: Log["status"]) => update((d) => ({ ...d, logs: [...d.logs.filter((l) => !(l.blockId === b.id && l.date === date)),
    { id: uid(), blockId: b.id, date, status, actualMin: status === "skipped" ? 0 : Math.max(0, Math.min(min, 1440)), notes: note }] }));
  const del = () => { if (confirm(b.kind === "once" ? "Delete this block?" : "Delete this recurring block and every occurrence?"))
    update((d) => ({ ...d, blocks: d.blocks.filter((x) => x.id !== b.id), logs: d.logs.filter((l) => l.blockId !== b.id) })); };
  const goal = db.goals.find((g) => g.id === b.goalId)?.name;
  return (
    <div className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-40 flex-1"><div>{b.title}{!b.productive && <span className="ml-2 text-xs text-mute">not counted as productive</span>}</div><div className="text-xs text-mute">{goal ?? "No goal"} · {b.kind}</div></div>
        <input type="time" className="input w-auto" value={b.start} onChange={(e) => e.target.value && patch({ start: e.target.value })} aria-label="Start time" />
        <input type="number" min={5} max={720} className="input w-20" value={b.durMin} onChange={(e) => patch({ durMin: Math.max(5, Number(e.target.value) || 5) })} aria-label="Duration in minutes" />
        <label className="flex items-center gap-1 text-xs text-mute"><input type="checkbox" checked={b.fixed} onChange={(e) => patch({ fixed: e.target.checked })} />Fixed</label>
        <button className="btn" onClick={del} aria-label={`Delete ${b.title}`}><Trash2 size={14} /></button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {log ? <span className="text-mute">Logged: {log.status}{log.actualMin ? `, ${log.actualMin} min` : ""}{log.notes ? ` · ${log.notes}` : ""}</span> : null}
        <input type="number" min={0} className="input w-20" value={min} onChange={(e) => setMin(Number(e.target.value))} aria-label="Actual minutes" />
        <input className="input min-w-32 flex-1" placeholder="Session notes" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn" onClick={() => setLog("done")}>Done</button><button className="btn" onClick={() => setLog("partial")}>Partial</button><button className="btn" onClick={() => setLog("skipped")}>Skipped</button>
      </div>
    </div>
  );
}

export default function Planner() {
  const [db, update] = useDB();
  const [date, setDate] = useState(dstr(new Date()));
  const [f, setF] = useState({ title: "", goalId: "", start: "07:00", dur: 60, kind: "weekly" as Block["kind"], days: [0, 1, 2, 3, 4, 5, 6], fixed: true, productive: true });
  const [moveTo, setMoveTo] = useState<Record<string, string>>({}); const [err, setErr] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const bs = blocksOn(db, date);
  const prod = bs.filter((b) => b.productive);
  const planned = prod.reduce((s, b) => s + b.durMin, 0);
  const actual = db.logs.filter((l) => l.date === date && prod.some((b) => b.id === l.blockId)).reduce((s, l) => s + l.actualMin, 0);
  const sleep = sleepRanges(db);
  const issues: string[] = [];
  bs.forEach((a, i) => { const a0 = toMin(a.start), a1 = a0 + a.durMin;
    if (a1 > 1440) issues.push(`${a.title} runs past midnight.`);
    bs.slice(i + 1).forEach((b) => overlap(a0, a1, toMin(b.start), toMin(b.start) + b.durMin) && issues.push(`${a.title} overlaps ${b.title}.`));
    sleep.forEach(([s0, s1]) => overlap(a0, a1, s0, s1) && issues.push(`${a.title} overlaps your sleep window.`)); });
  const waking = 1440 - sleep.reduce((s, [a, b]) => s + b - a, 0);
  if (planned > waking) issues.push("Productive hours exceed your waking hours.");

  const add = () => {
    const s = toMin(f.start);
    if (!f.title.trim()) return setErr("Enter a title.");
    if (!(f.dur >= 5) || s + f.dur > 1440) return setErr("Duration must be 5+ minutes and end before midnight.");
    if (f.kind === "weekly" && f.days.length === 0) return setErr("Pick at least one weekday.");
    setErr("");
    update((d) => ({ ...d, blocks: [...d.blocks, { id: uid(), title: f.title.trim(), goalId: f.goalId || undefined, start: f.start, durMin: f.dur, kind: f.kind,
      date: f.kind === "once" ? date : undefined, days: f.kind === "weekly" ? f.days : [], monthDay: f.kind === "monthly" ? parse(date).getDate() : undefined, fixed: f.fixed, productive: f.productive }] }));
    setF({ ...f, title: "" });
  };
  const today = dstr(new Date()), nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const missed: { b: Block; date: string }[] = [];
  for (let i = 0; i < 7; i++) { const dt = new Date(); dt.setDate(dt.getDate() - i); const ds = dstr(dt);
    blocksOn(db, ds).forEach((b) => { const ended = ds < today || toMin(b.start) + b.durMin <= nowMin; const l = db.logs.find((x) => x.blockId === b.id && x.date === ds);
      if (b.productive && ended && (!l || l.status === "skipped")) missed.push({ b, date: ds }); }); }
  const reschedule = (m: { b: Block; date: string }) => {
    const t = moveTo[m.b.id + m.date] ?? m.b.start;
    if (toMin(t) + m.b.durMin > 1440) return setErr("That time runs past midnight.");
    setErr("");
    update((d) => ({ ...d, blocks: [...d.blocks, { ...m.b, id: uid(), kind: "once", date: today, days: [], monthDay: undefined, start: t, fixed: false }],
      logs: [...d.logs.filter((l) => !(l.blockId === m.b.id && l.date === m.date)), { id: uid(), blockId: m.b.id, date: m.date, status: "rescheduled", actualMin: 0, notes: `moved to ${today} ${t}` }] }));
  };
  const setSleep = (k: "sleepStart" | "sleepEnd", v: string) => v && update((d) => ({ ...d, settings: { ...d.settings, [k]: v } }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Daily Planner</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input type="date" className="input w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date" />
          <label className="flex items-center gap-1 text-mute">Sleep <input type="time" className="input w-auto" value={db.settings.sleepStart} onChange={(e) => setSleep("sleepStart", e.target.value)} /> to <input type="time" className="input w-auto" value={db.settings.sleepEnd} onChange={(e) => setSleep("sleepEnd", e.target.value)} /></label>
        </div>
      </div>
      <p className="text-sm text-mute">Planned productive time {(planned / 60).toFixed(1)} h · logged {(actual / 60).toFixed(1)} h · breaks, meals and sleep are never counted.</p>
      {issues.length > 0 && <ul className="card border-warn p-3 text-sm text-warn">{Array.from(new Set(issues)).map((i) => <li key={i}>{i}</li>)}</ul>}
      {err && <p className="text-sm text-warn">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="card relative overflow-hidden" style={{ height: 24 * PX }} aria-label="24-hour timeline">
          {sleep.map(([a, b], i) => <div key={i} className="absolute inset-x-0 bg-line/60" style={{ top: (a / 60) * PX, height: ((b - a) / 60) * PX }} />)}
          {Array.from({ length: 24 }, (_, h) => <div key={h} className="absolute inset-x-0 border-t border-line text-[10px] text-mute" style={{ top: h * PX }}>{h % 3 === 0 ? <span className="pl-1">{fmt(h * 60)}</span> : null}</div>)}
          {bs.map((b) => <div key={b.id} title={b.title} className={`absolute left-10 right-1 overflow-hidden rounded px-1 text-[11px] leading-tight ${b.productive ? "bg-accent/80 text-white" : "bg-mute/50 text-ink"}`} style={{ top: (toMin(b.start) / 60) * PX, height: Math.max((b.durMin / 60) * PX - 1, 10) }}>{b.title}</div>)}
        </div>
        <div className="space-y-6">
          <section className="card divide-y divide-line">
            {bs.length === 0 ? <p className="p-4 text-mute">No blocks on this date. Add one below.</p> : bs.map((b) => <Row key={b.id + date} b={b} date={date} db={db} update={update} />)}
          </section>
          <section className="card grid gap-2 p-4 md:grid-cols-6">
            <h2 className="font-medium md:col-span-6">Add block</h2>
            <input className="input md:col-span-3" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <select className="input md:col-span-3" value={f.goalId} onChange={(e) => setF({ ...f, goalId: e.target.value })}><option value="">No goal</option>{db.goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
            <input type="time" className="input md:col-span-2" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} aria-label="Start" />
            <input type="number" className="input md:col-span-2" value={f.dur} onChange={(e) => setF({ ...f, dur: Number(e.target.value) })} aria-label="Minutes" />
            <select className="input md:col-span-2" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Block["kind"] })}><option value="weekly">Repeats weekly</option><option value="monthly">Monthly (this date)</option><option value="once">Once (this date)</option></select>
            {f.kind === "weekly" && <div className="flex gap-1 md:col-span-6">{DAYS.map((d, i) => <button key={d} className={`btn ${f.days.includes(i) ? "btn-primary" : ""}`} onClick={() => setF({ ...f, days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i] })}>{d}</button>)}</div>}
            <label className="flex items-center gap-1 text-sm md:col-span-2"><input type="checkbox" checked={f.fixed} onChange={(e) => setF({ ...f, fixed: e.target.checked })} />Fixed time</label>
            <label className="flex items-center gap-1 text-sm md:col-span-2"><input type="checkbox" checked={f.productive} onChange={(e) => setF({ ...f, productive: e.target.checked })} />Counts as productive</label>
            <button className="btn btn-primary justify-center md:col-span-2" onClick={add}>Add block</button>
          </section>
        </div>
      </div>

      <section>
        <h2 className="mb-2 font-medium">Rescheduling queue (last 7 days)</h2>
        {missed.length === 0 ? <p className="text-sm text-mute">Nothing missed. Missed blocks wait here and are never moved into sleep automatically.</p> : (
          <div className="card divide-y divide-line">{missed.map((m) => (
            <div key={m.b.id + m.date} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <span className="flex-1">{m.b.title} <span className="text-mute">· {m.date} · {m.b.durMin} min</span></span>
              <input type="time" className="input w-auto" value={moveTo[m.b.id + m.date] ?? m.b.start} onChange={(e) => setMoveTo({ ...moveTo, [m.b.id + m.date]: e.target.value })} aria-label="New time today" />
              <button className="btn" onClick={() => reschedule(m)}>Move to today</button>
            </div>))}</div>)}
      </section>
    </div>
  );
}
