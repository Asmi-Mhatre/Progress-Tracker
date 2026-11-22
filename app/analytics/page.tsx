"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { uid, useDB } from "@/lib/store";
import { alignment, examRisk, goalName, lastDays, missed, neglected, rangeStats, streak } from "@/lib/analytics";
import { dstr } from "@/lib/time";

const h = (m: number) => (m / 60).toFixed(1);
const TIP = { background: "rgb(var(--panel))", border: "1px solid rgb(var(--line))" };
const LEAK = ["Social media", "Browsing", "Video / TV", "Gaming", "Other"];

export default function Analytics() {
  const [db, update] = useDB();
  const [n, setN] = useState(7); const [lm, setLm] = useState(15); const [lc, setLc] = useState(LEAK[0]); const [ln, setLn] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const today = dstr(new Date()), dates = lastDays(n), r = rangeStats(db, dates);
  const keys = Array.from(new Set([...Object.keys(r.planned), ...Object.keys(r.actual)]));
  const rows = keys.map((k) => ({ name: goalName(db, k), Planned: +h(r.planned[k] ?? 0), Actual: +h(r.actual[k] ?? 0) })).sort((a, b) => b.Planned + b.Actual - (a.Planned + a.Actual));
  const exec = r.plannedTotal ? Math.round((r.actualTotal / r.plannedTotal) * 100) : null;
  const al = alignment(db, r.actual), neg = neglected(db, r.actual);
  const risks = db.exams.map((e) => examRisk(e, db.topics.filter((t) => t.examId === e.id), today)).filter((x) => x !== null);
  const miss = missed(db, dates);
  const cat: Record<string, number> = {}; Object.entries(r.actual).forEach(([k, v]) => { const c = db.goals.find((g) => g.id === k)?.category ?? "Unlinked"; cat[c] = (cat[c] ?? 0) + v; });
  const due = db.tasks.filter((t) => t.due && dates.includes(t.due)), doneDue = due.filter((t) => t.done).length;
  const overdue = db.tasks.filter((t) => !t.done && t.due && t.due < today);
  const scored = r.days.filter((d) => d.score !== undefined);
  const weeks = [3, 2, 1, 0].map((w) => { const ds = lastDays(7, new Date(Date.now() - w * 7 * 864e5)); return { name: w === 0 ? "This week" : `${w}w ago`, Minutes: db.leaks.filter((l) => ds.includes(l.date)).reduce((s, l) => s + l.minutes, 0) }; });
  const prog = db.exams.map((e) => { const ts = db.topics.filter((t) => t.examId === e.id), ps = new Set(ts.map((t) => t.parentId)), ls = ts.filter((t) => !ps.has(t.id)); return { e, d: ls.filter((t) => t.done).length, n: ls.length }; }).filter((x) => x.n > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex gap-1">{[7, 14, 30].map((d) => <button key={d} className={`btn ${n === d ? "btn-primary" : ""}`} onClick={() => setN(d)}>{d} days</button>)}</div></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["Planned", `${h(r.plannedTotal)} h`], ["Actual", `${h(r.actualTotal)} h`], ["Execution", exec === null ? "n/a" : `${exec}%`], ["Streak", `${streak(db)} d`], ["Alignment", al === null ? "n/a" : `${al}`]].map(([l, v]) => <div key={l} className="card p-3"><div className="text-xs text-mute">{l}</div><div className="text-xl font-semibold">{v}</div></div>)}
      </div>
      <p className="text-xs text-mute">Actual time comes only from logged planner blocks and finished focus sessions (the larger of the two per goal per day, so nothing is counted twice). Streak = consecutive days with at least 80% of planned time logged. Alignment compares your time shares with goal importance and needs 2+ hours of data.</p>

      <section className="card p-5"><h2 className="mb-3 font-medium">Planned vs actual by goal (hours)</h2>
        {rows.length === 0 ? <p className="text-sm text-mute">No planned blocks or sessions in this period.</p> : <>
          <div style={{ height: 40 + rows.length * 38 }}><ResponsiveContainer><BarChart data={rows} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke="rgb(var(--line))" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><Tooltip contentStyle={TIP} /><Legend />
            <Bar dataKey="Planned" fill="rgb(var(--mute))" /><Bar dataKey="Actual" fill="rgb(var(--accent))" /></BarChart></ResponsiveContainer></div>
          <table className="mt-3 w-full text-sm"><thead className="text-left text-xs text-mute"><tr><th>Goal</th><th>Planned</th><th>Actual</th><th>Difference</th></tr></thead>
            <tbody>{rows.map((x) => { const d = +(x.Actual - x.Planned).toFixed(1); return <tr key={x.name} className="border-t border-line"><td>{x.name}</td><td>{x.Planned}</td><td>{x.Actual}</td><td className={d < 0 ? "text-warn" : ""}>{d > 0 ? "+" : ""}{d} h</td></tr>; })}</tbody></table></>}
      </section>

      <section className="card p-5"><h2 className="mb-3 font-medium">Daily hours{scored.length ? ` · average execution ${Math.round(scored.reduce((s, d) => s + (d.score ?? 0), 0) / scored.length)}%` : ""}</h2>
        <div style={{ height: 220 }}><ResponsiveContainer><BarChart data={r.days.map((d) => ({ name: d.date.slice(5), Planned: +h(d.plannedTotal), Actual: +h(d.actualTotal) }))}><CartesianGrid stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={TIP} /><Legend /><Bar dataKey="Planned" fill="rgb(var(--mute))" /><Bar dataKey="Actual" fill="rgb(var(--accent))" /></BarChart></ResponsiveContainer></div></section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-2 p-5 text-sm"><h2 className="font-medium">Signals</h2>
          {neg.length === 0 && risks.length === 0 && <p className="text-mute">No neglected goals or exam pace risks detected from the data so far.</p>}
          {neg.map((x) => <p key={x.name} className="text-warn">{x.name} has importance {x.weight} but {x.none ? "no time recorded" : `only ${h(x.min)} h`} in {n} days.</p>)}
          {risks.map((x) => x && <p key={x.name} className="text-warn">{x.name}: {x.rem} topics left in {x.left} days needs {x.need.toFixed(1)} per week; recent pace is {x.pace.toFixed(1)}.</p>)}
        </section>
        <section className="card space-y-1 p-5 text-sm"><h2 className="mb-1 font-medium">Time by category</h2>
          {Object.keys(cat).length === 0 ? <p className="text-mute">No recorded time.</p> : Object.entries(cat).map(([c, v]) => <div key={c} className="flex justify-between"><span>{c}</span><span className="text-mute">{h(v)} h · {Math.round((v / r.actualTotal) * 100)}%</span></div>)}</section>
        <section className="card space-y-1 p-5 text-sm"><h2 className="mb-1 font-medium">Tasks and missed blocks</h2>
          <p>{due.length ? `${doneDue} of ${due.length} tasks due in this period are done (${Math.round((doneDue / due.length) * 100)}%).` : "No tasks were due in this period."}</p>
          {overdue.length > 0 && <p className="text-warn">{overdue.length} overdue: {overdue.slice(0, 3).map((t) => t.title).join(", ")}. Postponement history is not tracked.</p>}
          {miss.length === 0 ? <p className="text-mute">No missed planner blocks.</p> : <p>Most missed: {miss.slice(0, 4).map(([t, c]) => `${t} (${c}×)`).join(", ")}.</p>}</section>
        <section className="card space-y-1 p-5 text-sm"><h2 className="mb-1 font-medium">Exam syllabus progress</h2>
          {prog.length === 0 ? <p className="text-mute">Add syllabus topics under Examinations.</p> : prog.map((x) => <div key={x.e.id}><div className="flex justify-between"><span>{x.e.name}</span><span className="text-mute">{x.d}/{x.n}</span></div><div className="h-1.5 rounded bg-line"><div className="h-1.5 rounded bg-accent" style={{ width: `${(x.d / x.n) * 100}%` }} /></div></div>)}</section>
      </div>

      <section className="card space-y-3 p-5"><h2 className="font-medium">Time leakage</h2>
        <p className="text-sm text-mute">Log unplanned time without judgment. This is just a record of where time went.</p>
        <div className="flex flex-wrap gap-2"><select className="input w-auto" value={lc} onChange={(e) => setLc(e.target.value)}>{LEAK.map((c) => <option key={c}>{c}</option>)}</select>
          <input type="number" min={1} className="input w-24" value={lm} onChange={(e) => setLm(Number(e.target.value))} aria-label="Minutes" />
          <input className="input min-w-32 flex-1" placeholder="Note (optional)" value={ln} onChange={(e) => setLn(e.target.value)} />
          <button className="btn btn-primary" onClick={() => { if (lm >= 1) { update((d) => ({ ...d, leaks: [...d.leaks, { id: uid(), date: today, minutes: lm, category: lc, note: ln }] })); setLn(""); } }}>Log</button></div>
        <div style={{ height: 160 }}><ResponsiveContainer><BarChart data={weeks}><CartesianGrid stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip contentStyle={TIP} /><Bar dataKey="Minutes" fill="rgb(var(--warn))" /></BarChart></ResponsiveContainer></div>
        {db.leaks.slice(-5).reverse().map((l) => <div key={l.id} className="flex items-center justify-between text-sm"><span>{l.date} · {l.category} · {l.minutes} min{l.note ? ` · ${l.note}` : ""}</span>
          <button className="btn py-0.5" aria-label="Delete entry" onClick={() => update((d) => ({ ...d, leaks: d.leaks.filter((x) => x.id !== l.id) }))}><Trash2 size={12} /></button></div>)}
      </section>
    </div>
  );
}
