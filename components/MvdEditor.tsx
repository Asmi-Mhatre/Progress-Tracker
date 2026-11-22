"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";

export default function MvdEditor() {
  const [db, update] = useDB();
  const [t, setT] = useState(""); const [min, setMin] = useState(30); const [g, setG] = useState("");
  if (!db) return null;
  const items = db.settings.mvd ?? [];
  const set = (mvd: typeof items) => update((d) => ({ ...d, settings: { ...d.settings, mvd } }));
  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-medium">Minimum viable day</h2>
      <p className="text-sm text-mute">The smallest routine that keeps your top goals alive on a hard day. Logged items count as focus time.</p>
      {items.map((m) => <div key={m.id} className="flex items-center justify-between text-sm"><span>{m.title} · {m.min} min · {db.goals.find((x) => x.id === m.goalId)?.name ?? "No goal"}</span>
        <button className="btn py-0.5" aria-label={`Remove ${m.title}`} onClick={() => set(items.filter((x) => x.id !== m.id))}><Trash2 size={13} /></button></div>)}
      <div className="flex flex-wrap gap-2">
        <input className="input min-w-40 flex-1" placeholder="Item, e.g. 30 min CAT practice" value={t} onChange={(e) => setT(e.target.value)} />
        <input type="number" min={5} className="input w-20" value={min} onChange={(e) => setMin(Number(e.target.value))} aria-label="Minutes" />
        <select className="input w-auto" value={g} onChange={(e) => setG(e.target.value)}><option value="">No goal</option>{db.goals.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <button className="btn btn-primary" onClick={() => { if (t.trim() && min >= 5) { set([...items, { id: uid(), title: t.trim(), min, goalId: g || undefined }]); setT(""); } }}>Add item</button>
      </div>
    </section>
  );
}
