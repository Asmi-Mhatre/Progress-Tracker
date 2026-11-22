"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";
import { dstr } from "@/lib/time";
import { AREAS, Lead, Milestone, STAGES } from "@/lib/types";

export default function Projects() {
  const [db, update] = useDB();
  const [sel, setSel] = useState(""); const [np, setNp] = useState(""); const [err, setErr] = useState("");
  const [m, setM] = useState({ title: "", area: AREAS[0] as Milestone["area"], due: "" });
  const [l, setL] = useState({ name: "", org: "", stage: STAGES[0] as Lead["stage"], nextStep: "", date: "" });
  if (!db) return <p className="text-mute">Loading…</p>;
  const p = db.projects.find((x) => x.id === sel) ?? db.projects[0], today = dstr(new Date());
  const addP = () => { if (!np.trim()) return; const id = uid(); update((d) => ({ ...d, projects: [...d.projects, { id, name: np.trim(), description: "" }] })); setSel(id); setNp(""); };
  if (!p) return (<div className="space-y-3"><h1 className="text-2xl font-semibold">Projects</h1><div className="flex gap-2"><input className="input w-56" placeholder="Project name" value={np} onChange={(e) => setNp(e.target.value)} /><button className="btn btn-primary" onClick={addP}>Add project</button></div></div>);
  const ms = db.milestones.filter((x) => x.projectId === p.id).sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  const ls = db.leads.filter((x) => x.projectId === p.id);
  const done = ms.filter((x) => x.done).length;
  const patchM = (id: string, q: Partial<Milestone>) => update((d) => ({ ...d, milestones: d.milestones.map((x) => (x.id === id ? { ...x, ...q } : x)) }));
  const addM = () => { if (!m.title.trim()) return setErr("Enter a milestone or deliverable."); setErr(""); update((d) => ({ ...d, milestones: [...d.milestones, { id: uid(), projectId: p.id, title: m.title.trim(), area: m.area, due: m.due || undefined, done: false }] })); setM({ ...m, title: "" }); };
  const addL = () => { if (!l.name.trim()) return setErr("Enter a name for the lead."); setErr(""); update((d) => ({ ...d, leads: [...d.leads, { id: uid(), projectId: p.id, name: l.name.trim(), org: l.org, stage: l.stage, nextStep: l.nextStep, date: l.date || undefined }] })); setL({ ...l, name: "", org: "", nextStep: "" }); };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <div className="flex flex-wrap items-center gap-2">{db.projects.map((x) => <button key={x.id} className={`btn ${x.id === p.id ? "btn-primary" : ""}`} onClick={() => setSel(x.id)}>{x.name}</button>)}
        <input className="input w-44" placeholder="New project" value={np} onChange={(e) => setNp(e.target.value)} /><button className="btn" onClick={addP}>Add</button>
        <button className="btn ml-auto" aria-label="Delete project" onClick={() => confirm(`Delete ${p.name} with its milestones and leads?`) && (update((d) => ({ ...d, projects: d.projects.filter((x) => x.id !== p.id), milestones: d.milestones.filter((x) => x.projectId !== p.id), leads: d.leads.filter((x) => x.projectId !== p.id) })), setSel(""))}><Trash2 size={14} /></button></div>
      {err && <p className="text-sm text-warn">{err}</p>}
      <section className="card space-y-2 p-5"><h2 className="font-medium">Progress: {done} of {ms.length} milestones done</h2>
        <div className="h-2 rounded bg-line"><div className="h-2 rounded bg-accent" style={{ width: ms.length ? `${(done / ms.length) * 100}%` : "0%" }} /></div>
        <div className="grid gap-x-6 gap-y-1 pt-2 text-sm md:grid-cols-2">{AREAS.filter((a) => ms.some((x) => x.area === a)).map((a) => <div key={a} className="flex justify-between"><span>{a}</span><span className="text-mute">{ms.filter((x) => x.area === a && x.done).length}/{ms.filter((x) => x.area === a).length}</span></div>)}</div></section>
      <section className="card divide-y divide-line">
        {ms.length === 0 && <p className="p-4 text-sm text-mute">No milestones yet. Add weekly deliverables, launches or deadlines below.</p>}
        {ms.map((x) => <div key={x.id} className="flex flex-wrap items-center gap-2 p-3 text-sm"><input type="checkbox" checked={x.done} aria-label={`Complete ${x.title}`} onChange={(e) => patchM(x.id, { done: e.target.checked })} />
          <span className={`min-w-40 flex-1 ${x.done ? "text-mute line-through" : ""}`}>{x.title} <span className="text-xs text-mute">{x.area}</span></span>
          <input type="date" className="input w-auto" value={x.due ?? ""} onChange={(e) => patchM(x.id, { due: e.target.value || undefined })} aria-label="Due date" />
          {!x.done && x.due && x.due < today && <span className="text-warn">overdue</span>}
          <button className="btn py-0.5" aria-label={`Delete ${x.title}`} onClick={() => update((d) => ({ ...d, milestones: d.milestones.filter((y) => y.id !== x.id) }))}><Trash2 size={13} /></button></div>)}
        <div className="flex flex-wrap gap-2 p-3"><input className="input min-w-40 flex-1" placeholder="Milestone or weekly deliverable" value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} />
          <select className="input w-auto" value={m.area} onChange={(e) => setM({ ...m, area: e.target.value as Milestone["area"] })}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
          <input type="date" className="input w-auto" value={m.due} onChange={(e) => setM({ ...m, due: e.target.value })} aria-label="Due date" /><button className="btn btn-primary" onClick={addM}>Add</button></div>
      </section>
      <section className="card divide-y divide-line"><h2 className="p-3 font-medium">Customers, cofounders and outreach {ls.length ? `(${STAGES.map((s) => `${s} ${ls.filter((x) => x.stage === s).length}`).filter((x) => !x.endsWith(" 0")).join(", ")})` : ""}</h2>
        {ls.map((x) => <div key={x.id} className="flex flex-wrap items-center gap-2 p-3 text-sm"><div className="min-w-40 flex-1"><div>{x.name}{x.org ? ` · ${x.org}` : ""}</div><div className="text-xs text-mute">{x.nextStep}</div></div>
          <select className="input w-auto" value={x.stage} onChange={(e) => update((d) => ({ ...d, leads: d.leads.map((y) => (y.id === x.id ? { ...y, stage: e.target.value as Lead["stage"] } : y)) }))} aria-label="Stage">{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
          <input type="date" className="input w-auto" value={x.date ?? ""} onChange={(e) => update((d) => ({ ...d, leads: d.leads.map((y) => (y.id === x.id ? { ...y, date: e.target.value || undefined } : y)) }))} aria-label="Next contact date" />
          <button className="btn py-0.5" aria-label={`Delete ${x.name}`} onClick={() => update((d) => ({ ...d, leads: d.leads.filter((y) => y.id !== x.id) }))}><Trash2 size={13} /></button></div>)}
        <div className="flex flex-wrap gap-2 p-3"><input className="input min-w-32 flex-1" placeholder="Name" value={l.name} onChange={(e) => setL({ ...l, name: e.target.value })} /><input className="input min-w-32 flex-1" placeholder="Organisation" value={l.org} onChange={(e) => setL({ ...l, org: e.target.value })} />
          <select className="input w-auto" value={l.stage} onChange={(e) => setL({ ...l, stage: e.target.value as Lead["stage"] })}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
          <input className="input min-w-40 flex-1" placeholder="Next step" value={l.nextStep} onChange={(e) => setL({ ...l, nextStep: e.target.value })} /><button className="btn btn-primary" onClick={addL}>Add lead</button></div>
      </section>
    </div>
  );
}
