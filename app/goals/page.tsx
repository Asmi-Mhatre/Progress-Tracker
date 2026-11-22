"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";
import { CATEGORIES, Category, Goal, GoalStatus } from "@/lib/types";

export default function Goals() {
  const [db, update] = useDB();
  const [name, setName] = useState("");
  const [cat, setCat] = useState<Category>("Academics");
  const [err, setErr] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const patch = (id: string, p: Partial<Goal>) => update((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...p } : g)) }));
  const add = () => {
    if (!name.trim()) return setErr("Enter a goal name.");
    setErr(""); update((d) => ({ ...d, goals: [...d.goals, { id: uid(), name: name.trim(), category: cat, weight: 3, status: "active", notes: "" }] })); setName("");
  };
  const remove = (g: Goal) => { if (confirm(`Delete "${g.name}"? Its tasks stay but lose the goal link.`))
    update((d) => ({ ...d, goals: d.goals.filter((x) => x.id !== g.id), tasks: d.tasks.map((t) => (t.goalId === g.id ? { ...t, goalId: undefined } : t)) })); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Goals</h1>
      <div className="card flex flex-wrap gap-2 p-4">
        <input className="input min-w-48 flex-1" placeholder="New goal" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <button className="btn btn-primary" onClick={add}>Add goal</button>
        {err && <p className="w-full text-sm text-warn">{err}</p>}
      </div>
      {CATEGORIES.map((c) => {
        const list = db.goals.filter((g) => g.category === c);
        if (!list.length) return null;
        return (
          <section key={c}>
            <h2 className="mb-2 text-sm font-medium text-mute">{c}</h2>
            <div className="card divide-y divide-line">
              {list.map((g) => (
                <div key={g.id} className="flex flex-wrap items-center gap-3 p-3">
                  <input className="input min-w-40 flex-1" value={g.name} onChange={(e) => patch(g.id, { name: e.target.value })} aria-label="Goal name" />
                  <label className="flex items-center gap-1 text-xs text-mute">Importance
                    <select className="input w-auto" value={g.weight} onChange={(e) => patch(g.id, { weight: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label>
                  <input type="date" className="input w-auto" value={g.targetDate ?? ""} onChange={(e) => patch(g.id, { targetDate: e.target.value || undefined })} aria-label="Target date" />
                  <select className="input w-auto" value={g.status} onChange={(e) => patch(g.id, { status: e.target.value as GoalStatus })}><option value="active">Active</option><option value="paused">Paused</option><option value="done">Done</option></select>
                  <button className="btn" onClick={() => remove(g)} aria-label={`Delete ${g.name}`}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
