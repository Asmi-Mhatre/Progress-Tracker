"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";
import { dstr } from "@/lib/time";
import { daysUntil } from "@/components/ExamPanel";
import { DB, Exam, Topic } from "@/lib/types";

type Upd = (f: (d: DB) => DB) => void;
const DATES = [["regOpen", "Registration opens"], ["regDeadline", "Registration deadline"], ["admitDate", "Admit card"], ["examDate", "Exam date"], ["resultDate", "Result date"]] as const;
const today = () => dstr(new Date());

function Node({ t, all, upd }: { t: Topic; all: Topic[]; upd: (id: string, p: Partial<Topic>) => void }) {
  const kids = all.filter((x) => x.parentId === t.id);
  const [name, setName] = useState(""); const [open, setOpen] = useState(false);
  const leaves = (n: Topic): Topic[] => { const k = all.filter((x) => x.parentId === n.id); return k.length ? k.flatMap(leaves) : [n]; };
  const ls = leaves(t), done = ls.filter((l) => l.done).length;
  return (
    <div className="border-l border-line pl-3">
      <div className="flex flex-wrap items-center gap-2 py-1 text-sm">
        {kids.length === 0 ? <>
          <input type="checkbox" checked={t.done} onChange={(e) => upd(t.id, { done: e.target.checked, doneAt: e.target.checked ? today() : undefined })} aria-label={`${t.name} complete`} />
          <span className={`flex-1 ${t.done ? "text-mute" : ""}`}>{t.name}</span>
          {(["rev1", "rev2", "rev3"] as const).map((k, i) => <label key={k} className="flex items-center gap-0.5 text-xs text-mute"><input type="checkbox" checked={t[k]} onChange={(e) => upd(t.id, { [k]: e.target.checked })} />R{i + 1}</label>)}
          <input type="number" min={0} step={0.5} className="input w-16 py-0.5" placeholder="hrs" value={t.estH ?? ""} onChange={(e) => upd(t.id, { estH: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)) })} aria-label="Estimated hours" />
        </> : <span className="flex-1 font-medium">{t.name} <span className="font-normal text-mute">{done}/{ls.length}</span></span>}
        <button className="btn py-0.5" onClick={() => setOpen(!open)}>{open ? "Close" : "Add sub-topic"}</button>
        <button className="btn py-0.5" aria-label={`Delete ${t.name}`} onClick={() => upd(t.id, { name: "\u0000delete" })}><Trash2 size={12} /></button>
      </div>
      {open && <div className="flex gap-2 pb-2"><input className="input" placeholder="Sub-topic name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" onClick={() => { if (name.trim()) { upd("\u0000add:" + t.id, { name: name.trim() }); setName(""); } }}>Add</button></div>}
      {kids.map((k) => <Node key={k.id} t={k} all={all} upd={upd} />)}
    </div>
  );
}

function Plan({ e, topics }: { e: Exam; topics: Topic[] }) {
  const parents = new Set(topics.map((t) => t.parentId));
  const leaves = topics.filter((t) => !parents.has(t.id));
  const rem = leaves.filter((t) => !t.done);
  const t0 = today();
  const left = e.examDate ? daysUntil(e.examDate, t0) : null;
  const pace = leaves.filter((t) => t.doneAt && daysUntil(t.doneAt, t0) >= -14).length / 2;
  const estRem = rem.reduce((s, t) => s + (t.estH ?? 0), 0);
  const noEst = rem.filter((t) => t.estH === undefined).length;
  if (leaves.length === 0) return <p className="text-sm text-mute">Add syllabus topics below to get a reverse plan.</p>;
  if (left === null) return <p className="text-sm text-mute">Set the exam date to calculate a plan. {rem.length} of {leaves.length} topics remain.</p>;
  if (left <= 0) return <p className="text-sm text-warn">The exam date has passed. Update it if it moved.</p>;
  const weeks = left / 7, need = rem.length / weeks;
  const behind = rem.length > 0 && pace < need;
  return (
    <div className="space-y-1 text-sm">
      <p>{rem.length} of {leaves.length} topics remain, {left} days left: about {need.toFixed(1)} topics per week needed.</p>
      <p className={behind ? "text-warn" : ""}>{pace === 0 && rem.length ? "No topics completed in the last 14 days." : `Recent pace: ${pace.toFixed(1)} per week. ${behind ? "Behind the pace needed." : "On pace."}`}</p>
      {estRem > 0 && <p>Estimated {estRem} h remaining, about {(estRem / weeks).toFixed(1)} h per week{e.weeklyHours ? ` against your ${e.weeklyHours} h target` : ""}.{noEst ? ` ${noEst} topics have no hour estimate.` : ""}</p>}
      <p className="text-mute">Revisions pending: R1 {leaves.filter((t) => !t.rev1).length} · R2 {leaves.filter((t) => !t.rev2).length} · R3 {leaves.filter((t) => !t.rev3).length}. Pace uses completion dates recorded since you ticked topics.</p>
    </div>
  );
}

export default function Exams() {
  const [db, update] = useDB();
  const [sel, setSel] = useState(""); const [nn, setNn] = useState(""); const [subj, setSubj] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const e = db.exams.find((x) => x.id === sel) ?? db.exams[0];
  const patch = (p: Partial<Exam>) => update((d) => ({ ...d, exams: d.exams.map((x) => (x.id === e.id ? { ...x, ...p } : x)) }));
  const topics = e ? db.topics.filter((t) => t.examId === e.id) : [];
  const addExam = () => { if (!nn.trim()) return; const id = uid(); update((d) => ({ ...d, exams: [...d.exams, { id, name: nn.trim(), format: "" }] })); setSel(id); setNn(""); };
  const mk = (name: string, parentId?: string): Topic => ({ id: uid(), examId: e.id, parentId, name, done: false, rev1: false, rev2: false, rev3: false });
  const upd = (id: string, p: Partial<Topic>) => update((d) => {
    if (id.startsWith("\u0000add:")) return { ...d, topics: [...d.topics, mk(p.name as string, id.slice(5))] };
    if (p.name === "\u0000delete") { const gone = new Set([id]); let grow = true;
      while (grow) { grow = false; d.topics.forEach((t) => { if (t.parentId && gone.has(t.parentId) && !gone.has(t.id)) { gone.add(t.id); grow = true; } }); }
      return { ...d, topics: d.topics.filter((t) => !gone.has(t.id)) }; }
    return { ...d, topics: d.topics.map((t) => (t.id === id ? { ...t, ...p } : t)) };
  });
  const numField = (k: "weeklyHours" | "targetScore" | "targetPercentile", label: string) => (
    <label className="text-xs text-mute">{label}<input type="number" min={0} className="input" value={e[k] ?? ""} onChange={(ev) => patch({ [k]: ev.target.value === "" ? undefined : Math.max(0, Number(ev.target.value)) })} /></label>);
  const roots = topics.filter((t) => !t.parentId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Examinations</h1>
      <div className="flex flex-wrap items-center gap-2">
        {db.exams.map((x) => <button key={x.id} className={`btn ${x.id === e?.id ? "btn-primary" : ""}`} onClick={() => setSel(x.id)}>{x.name}</button>)}
        <input className="input w-44" placeholder="New exam" value={nn} onChange={(ev) => setNn(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && addExam()} />
        <button className="btn" onClick={addExam}>Add exam</button>
      </div>
      {!e ? <p className="text-mute">Add your first exam above.</p> : <>
        <section className="card space-y-3 p-5">
          <div className="flex gap-2"><input className="input text-base font-medium" value={e.name} onChange={(ev) => patch({ name: ev.target.value })} aria-label="Exam name" />
            <button className="btn" aria-label="Delete exam" onClick={() => { if (confirm(`Delete ${e.name} with its syllabus, mocks and mistakes?`)) { update((d) => ({ ...d, exams: d.exams.filter((x) => x.id !== e.id), topics: d.topics.filter((t) => t.examId !== e.id), mocks: d.mocks.filter((m) => m.examId !== e.id), mistakes: d.mistakes.filter((m) => m.examId !== e.id) })); setSel(""); } }}><Trash2 size={14} /></button></div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {DATES.map(([k, l]) => <label key={k} className="text-xs text-mute">{l}{e[k] ? ` (${daysUntil(e[k] as string, today())} d)` : ""}<input type="date" className="input" value={e[k] ?? ""} onChange={(ev) => patch({ [k]: ev.target.value || undefined })} /></label>)}
            <label className="text-xs text-mute">Format<input className="input" value={e.format} onChange={(ev) => patch({ format: ev.target.value })} /></label>
            {numField("weeklyHours", "Weekly study target (h)")}{numField("targetScore", "Target score")}{numField("targetPercentile", "Target percentile")}
            <label className="text-xs text-mute">Linked goal<select className="input" value={e.goalId ?? ""} onChange={(ev) => patch({ goalId: ev.target.value || undefined })}><option value="">None</option>{db.goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
          </div>
        </section>
        <section className="card space-y-2 p-5"><h2 className="font-medium">Reverse plan</h2><Plan e={e} topics={topics} /></section>
        <section className="card space-y-2 p-5">
          <h2 className="font-medium">Syllabus</h2>
          {roots.length === 0 && <p className="text-sm text-mute">No topics yet. Add a subject, then sub-topics down to the chapter level.</p>}
          {roots.map((t) => <Node key={t.id} t={t} all={topics} upd={upd} />)}
          <div className="flex gap-2 pt-2"><input className="input" placeholder="New subject" value={subj} onChange={(ev) => setSubj(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter" && subj.trim()) { update((d) => ({ ...d, topics: [...d.topics, mk(subj.trim())] })); setSubj(""); } }} />
            <button className="btn" onClick={() => { if (subj.trim()) { update((d) => ({ ...d, topics: [...d.topics, mk(subj.trim())] })); setSubj(""); } }}>Add subject</button></div>
        </section>
      </>}
    </div>
  );
}
