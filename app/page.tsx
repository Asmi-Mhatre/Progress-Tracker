"use client";
import { useEffect, useState } from "react";
import { useDB } from "@/lib/store";
import ExamPanel from "@/components/ExamPanel";
import AlertsPanel from "@/components/AlertsPanel";
import MvdPanel from "@/components/MvdPanel";
import NowPanel from "@/components/NowPanel";

export default function Dashboard() {
  const [db, update] = useDB();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  if (!db || !now) return <p className="text-mute">Loading…</p>;
  const today = now.toLocaleDateString("en-CA");
  const open = db.tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.due && t.due < today);
  const todays = open.filter((t) => t.due === today).sort((a, b) => a.priority - b.priority);
  const doneToday = db.tasks.filter((t) => t.done).length;
  const active = db.goals.filter((g) => g.status === "active" && !g.parentId);
  const totalW = active.reduce((s, g) => s + g.weight, 0) || 1;
  const nameOf = (id?: string) => db.goals.find((g) => g.id === id)?.name;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h1>
          <p className="text-mute">{overdue.length ? `${overdue.length} overdue · ` : ""}{todays.length} due today · {open.length} open in total</p>
        </div>
        <div className="text-3xl font-semibold tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
      </header>

      <NowPanel db={db} update={update} now={now} />
      <AlertsPanel db={db} now={now} />
      <MvdPanel db={db} update={update} today={today} />
      <ExamPanel db={db} today={today} />

      <section className="card p-5">
        <h2 className="mb-3 font-medium">Tasks to clear</h2>
        {overdue.length > 0 && <p className="mb-3 text-sm text-warn">You have {overdue.length} overdue task{overdue.length > 1 ? "s" : ""}. Clear or reschedule them first.</p>}
        {(overdue.length ? overdue : todays).length === 0 ? (
          <p className="text-mute">Nothing is due today. Add tasks on the Tasks page. Timed schedule blocks arrive with the Daily Planner phase.</p>
        ) : (
          <ul className="space-y-2">
            {[...overdue, ...todays].map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <div><div>{t.title}</div><div className="text-xs text-mute">{nameOf(t.goalId) ?? "No goal"} · {t.estMin} min{t.due && t.due < today ? ` · due ${t.due}` : ""}</div></div>
                <button className="btn btn-primary" onClick={() => update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, done: true } : x)) }))}>Complete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-medium">Intended priority by goal</h2>
          <ul className="space-y-2">
            {active.map((g) => (
              <li key={g.id} className="text-sm">
                <div className="flex justify-between"><span>{g.name}</span><span className="text-mute">{Math.round((g.weight / totalW) * 100)}%</span></div>
                <div className="mt-1 h-1.5 rounded bg-line"><div className="h-1.5 rounded bg-accent" style={{ width: `${(g.weight / totalW) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-mute">Actual-versus-intended comparison appears once time sessions are recorded.</p>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-medium">Completed tasks</h2>
          <div className="text-3xl font-semibold">{doneToday}</div>
          <p className="text-sm text-mute">{db.tasks.length ? `of ${db.tasks.length} created` : "No tasks yet"}</p>
        </section>
      </div>
    </div>
  );
}
