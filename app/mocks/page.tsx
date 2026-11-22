"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { uid, useDB } from "@/lib/store";
import { dstr } from "@/lib/time";
import { CAUSES, Mock } from "@/lib/types";

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));
const COL = ["rgb(var(--accent))", "rgb(var(--warn))", "rgb(var(--mute))", "#8a6fb0"];
const acc = (m: Mock) => m.accuracy ?? (m.attempted && m.correct !== undefined ? Math.round((m.correct / m.attempted) * 1000) / 10 : undefined);

function Chart({ title, data, keys, target }: { title: string; data: Record<string, string | number | undefined>[]; keys: string[]; target?: number }) {
  if (!data.length || !keys.length) return null;
  return (
    <div className="card p-4"><h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div style={{ height: 220 }}><ResponsiveContainer><LineChart data={data}><CartesianGrid stroke="rgb(var(--line))" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "rgb(var(--panel))", border: "1px solid rgb(var(--line))" }} />{keys.length > 1 && <Legend />}
        {target !== undefined && <ReferenceLine y={target} stroke="rgb(var(--warn))" strokeDasharray="4 4" label={{ value: "Target", fontSize: 11 }} />}
        {keys.map((k, i) => <Line key={k} dataKey={k} stroke={COL[i % 4]} connectNulls strokeWidth={2} dot />)}</LineChart></ResponsiveContainer></div></div>
  );
}

export default function Mocks() {
  const [db, update] = useDB();
  const [sel, setSel] = useState("");
  const blank = { name: "", date: dstr(new Date()), score: "", maxScore: "", percentile: "", accuracy: "", attempted: "", correct: "", incorrect: "", unattempted: "", timeMin: "", weak: "", lessons: "" };
  const [f, setF] = useState(blank); const [secs, setSecs] = useState<{ name: string; score: string; percentile: string }[]>([]);
  const [mf, setMf] = useState({ topic: "", cause: CAUSES[0] as (typeof CAUSES)[number], note: "", mockId: "" }); const [err, setErr] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const ex = db.exams.find((x) => x.id === sel) ?? db.exams[0];
  if (!ex) return <p className="text-mute">Add an exam under Examinations first.</p>;
  const mocks = db.mocks.filter((m) => m.examId === ex.id).sort((a, b) => a.date.localeCompare(b.date));
  const mistakes = db.mistakes.filter((m) => m.examId === ex.id);
  const secNames = Array.from(new Set(mocks.flatMap((m) => m.sections.map((s) => s.name))));
  const rows = mocks.map((m) => ({ name: m.name, Score: m.score, Percentile: m.percentile, Accuracy: acc(m), ...Object.fromEntries(m.sections.map((s) => [s.name, s.score])) }));
  const secRows = mocks.map((m) => ({ name: m.name, ...Object.fromEntries(m.sections.map((s) => [s.name, s.score])) }));

  const addMock = () => {
    const n = { score: num(f.score), maxScore: num(f.maxScore), percentile: num(f.percentile), accuracy: num(f.accuracy), attempted: num(f.attempted), correct: num(f.correct), incorrect: num(f.incorrect), unattempted: num(f.unattempted), timeMin: num(f.timeMin) };
    const vals = Object.values(n);
    if (!f.name.trim() || !f.date) return setErr("Enter a mock name and date.");
    if (vals.some((v) => v !== undefined && (!Number.isFinite(v) || v < 0))) return setErr("Numbers must be zero or more.");
    if ((n.percentile ?? 0) > 100 || (n.accuracy ?? 0) > 100) return setErr("Percentile and accuracy cannot exceed 100.");
    if (n.attempted !== undefined && (n.correct ?? 0) + (n.incorrect ?? 0) > n.attempted) return setErr("Correct plus incorrect exceeds attempted.");
    setErr("");
    update((d) => ({ ...d, mocks: [...d.mocks, { id: uid(), examId: ex.id, name: f.name.trim(), date: f.date, ...n, weak: f.weak, lessons: f.lessons,
      sections: secs.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), score: num(s.score), percentile: num(s.percentile) })) }] }));
    setF({ ...blank, date: f.date }); setSecs([]);
  };
  const addMistake = () => {
    if (!mf.topic.trim()) return setErr("Enter the topic of the mistake.");
    setErr(""); update((d) => ({ ...d, mistakes: [...d.mistakes, { id: uid(), examId: ex.id, mockId: mf.mockId || undefined, topic: mf.topic.trim(), cause: mf.cause, note: mf.note, date: dstr(new Date()) }] }));
    setMf({ ...mf, topic: "", note: "" });
  };
  const groups = Object.values(mistakes.reduce<Record<string, { topic: string; cause: string; n: number }>>((a, m) => { const k = m.topic.toLowerCase() + "|" + m.cause; a[k] = a[k] ?? { topic: m.topic, cause: m.cause, n: 0 }; a[k].n++; return a; }, {})).sort((a, b) => b.n - a.n);
  const recTitle = (g: { topic: string; cause: string }) => `Revise ${g.topic} (${g.cause.toLowerCase()})`;
  const num2 = (k: keyof typeof f, label: string) => <input type="number" className="input" placeholder={label} aria-label={label} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mock Tests</h1>
      <div className="flex flex-wrap gap-2">{db.exams.map((x) => <button key={x.id} className={`btn ${x.id === ex.id ? "btn-primary" : ""}`} onClick={() => setSel(x.id)}>{x.name}</button>)}</div>
      {err && <p className="text-sm text-warn">{err}</p>}

      {mocks.length === 0 ? <p className="text-mute">No mocks recorded for {ex.name}. Charts appear after you add results.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Chart title="Score progression" data={rows} keys={["Score"]} target={ex.targetScore} />
          <Chart title="Percentile progression" data={rows} keys={["Percentile"]} target={ex.targetPercentile} />
          <Chart title="Accuracy (%)" data={rows} keys={["Accuracy"]} />
          <Chart title="Section-wise scores" data={secRows} keys={secNames} />
        </div>)}
      {mocks.length === 1 && <p className="text-xs text-mute">Trends need at least two mocks.</p>}

      <section className="card divide-y divide-line">
        {mocks.map((m) => (
          <div key={m.id} className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
            <div><div className="font-medium">{m.name} <span className="font-normal text-mute">{m.date}</span></div>
              <div className="text-mute">{[m.score !== undefined && `Score ${m.score}${m.maxScore ? `/${m.maxScore}` : ""}`, m.percentile !== undefined && `${m.percentile}%ile`, acc(m) !== undefined && `${acc(m)}% accuracy`, m.timeMin && `${m.timeMin} min`, m.attempted !== undefined && `${m.attempted} attempted`].filter(Boolean).join(" · ")}</div>
              {m.sections.length > 0 && <div className="text-mute">{m.sections.map((s) => `${s.name}: ${s.score ?? "-"}${s.percentile !== undefined ? ` (${s.percentile}%ile)` : ""}`).join(" · ")}</div>}
              {(m.weak || m.lessons) && <div className="text-mute">{m.weak && `Weak: ${m.weak}. `}{m.lessons && `Lesson: ${m.lessons}`}</div>}</div>
            <button className="btn" aria-label={`Delete ${m.name}`} onClick={() => confirm(`Delete ${m.name}?`) && update((d) => ({ ...d, mocks: d.mocks.filter((x) => x.id !== m.id), mistakes: d.mistakes.map((x) => (x.mockId === m.id ? { ...x, mockId: undefined } : x)) }))}><Trash2 size={14} /></button>
          </div>))}
      </section>

      <section className="card grid gap-2 p-4 md:grid-cols-4">
        <h2 className="font-medium md:col-span-4">Add mock result for {ex.name}</h2>
        <input className="input md:col-span-3" placeholder="Mock name / provider" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
        {num2("score", "Score")}{num2("maxScore", "Max score")}{num2("percentile", "Percentile")}{num2("accuracy", "Accuracy %")}
        {num2("attempted", "Attempted")}{num2("correct", "Correct")}{num2("incorrect", "Incorrect")}{num2("unattempted", "Unattempted")}{num2("timeMin", "Time taken (min)")}
        <div className="space-y-2 md:col-span-4">
          {secs.map((s, i) => <div key={i} className="flex gap-2"><input className="input" placeholder="Section" value={s.name} onChange={(e) => setSecs(secs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <input type="number" className="input" placeholder="Score" value={s.score} onChange={(e) => setSecs(secs.map((x, j) => (j === i ? { ...x, score: e.target.value } : x)))} />
            <input type="number" className="input" placeholder="Percentile" value={s.percentile} onChange={(e) => setSecs(secs.map((x, j) => (j === i ? { ...x, percentile: e.target.value } : x)))} />
            <button className="btn" aria-label="Remove section" onClick={() => setSecs(secs.filter((_, j) => j !== i))}><Trash2 size={14} /></button></div>)}
          <div className="flex gap-2"><button className="btn" onClick={() => setSecs([...secs, { name: "", score: "", percentile: "" }])}>Add section</button>
            <button className="btn" onClick={() => setSecs(["VARC", "DILR", "QA"].map((name) => ({ name, score: "", percentile: "" })))}>Use VARC / DILR / QA</button></div></div>
        <input className="input md:col-span-2" placeholder="Weak areas" value={f.weak} onChange={(e) => setF({ ...f, weak: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Lessons learned" value={f.lessons} onChange={(e) => setF({ ...f, lessons: e.target.value })} />
        <button className="btn btn-primary justify-center md:col-span-4" onClick={addMock}>Save mock</button>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-medium">Mistake journal</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="input" placeholder="Topic (e.g. Percentages)" value={mf.topic} onChange={(e) => setMf({ ...mf, topic: e.target.value })} />
          <select className="input" value={mf.cause} onChange={(e) => setMf({ ...mf, cause: e.target.value as (typeof CAUSES)[number] })}>{CAUSES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="input" value={mf.mockId} onChange={(e) => setMf({ ...mf, mockId: e.target.value })}><option value="">No specific mock</option>{mocks.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <button className="btn btn-primary justify-center" onClick={addMistake}>Log mistake</button>
          <input className="input md:col-span-4" placeholder="What went wrong?" value={mf.note} onChange={(e) => setMf({ ...mf, note: e.target.value })} />
        </div>
        {groups.length > 0 && <div><h3 className="mb-1 text-sm font-medium">Recurring weaknesses and suggested revision</h3>
          <ul className="space-y-1 text-sm">{groups.slice(0, 6).map((g) => { const t = recTitle(g); const has = db.tasks.some((x) => !x.done && x.title === t);
            return <li key={t} className="flex items-center justify-between gap-2"><span>{g.topic} · {g.cause} · {g.n}×</span>
              <button className="btn py-0.5" disabled={has} onClick={() => update((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), title: t, goalId: ex.goalId, priority: 1, estMin: 45, done: false, createdAt: new Date().toISOString() }] }))}>{has ? "Task added" : "Add revision task"}</button></li>; })}</ul></div>}
        <div className="divide-y divide-line">{mistakes.slice().reverse().map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span>{m.topic} · {m.cause}{m.note ? ` · ${m.note}` : ""} <span className="text-mute">{m.date}</span></span>
            <button className="btn py-0.5" aria-label="Delete mistake" onClick={() => update((d) => ({ ...d, mistakes: d.mistakes.filter((x) => x.id !== m.id) }))}><Trash2 size={12} /></button></div>))}</div>
      </section>
    </div>
  );
}
