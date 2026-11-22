"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";

export default function Tasks() {
  const [db, update] = useDB();
  const [title, setTitle] = useState(""); const [goalId, setGoalId] = useState(""); const [due, setDue] = useState("");
  const [est, setEst] = useState(30); const [pri, setPri] = useState<1 | 2 | 3>(2); const [q, setQ] = useState(""); const [err, setErr] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const add = () => {
    if (!title.trim()) return setErr("Enter a task name.");
    if (!(est > 0)) return setErr("Estimated minutes must be above zero.");
    setErr("");
    update((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), title: title.trim(), goalId: goalId || undefined, due: due || undefined, estMin: est, priority: pri, done: false, createdAt: new Date().toISOString() }] }));
    setTitle("");
  };
  const today = new Date().toLocaleDateString("en-CA");
  const shown = db.tasks.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? "9999").localeCompare(b.due ?? "9999") || a.priority - b.priority);
  const nameOf = (id?: string) => db.goals.find((g) => g.id === id)?.name;
  const toggle = (id: string) => update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tasks</h1>
      <div className="card grid gap-2 p-4 md:grid-cols-6">
        <input className="input md:col-span-3" placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <select className="input md:col-span-3" value={goalId} onChange={(e) => setGoalId(e.target.value)}><option value="">No goal</option>{db.goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <input type="date" className="input md:col-span-2" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
        <input type="number" min={1} className="input" value={est} onChange={(e) => setEst(Number(e.target.value))} aria-label="Estimated minutes" />
        <select className="input" value={pri} onChange={(e) => setPri(Number(e.target.value) as 1 | 2 | 3)} aria-label="Priority"><option value={1}>High</option><option value={2}>Medium</option><option value={3}>Low</option></select>
        <button className="btn btn-primary justify-center" onClick={add}>Add task</button>
        {err && <p className="text-sm text-warn md:col-span-6">{err}</p>}
      </div>
      <input className="input" placeholder="Search tasks" value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 ? <p className="text-mute">No tasks to show.</p> : (
        <div className="card divide-y divide-line">
          {shown.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3">
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} aria-label={`Complete ${t.title}`} />
              <div className="flex-1">
                <div className={t.done ? "text-mute line-through" : ""}>{t.title}</div>
                <div className="text-xs text-mute">{nameOf(t.goalId) ?? "No goal"} · {t.estMin} min · {["", "High", "Medium", "Low"][t.priority]}{t.due ? ` · ${t.due}` : ""}{!t.done && t.due && t.due < today ? " · overdue" : ""}</div>
              </div>
              <button className="btn" aria-label={`Delete ${t.title}`} onClick={() => update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== t.id) }))}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
