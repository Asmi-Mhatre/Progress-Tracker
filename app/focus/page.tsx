"use client";
import { useEffect, useRef, useState } from "react";
import { uid, useDB } from "@/lib/store";
import { dstr } from "@/lib/time";

type Mode = "Focus" | "Short break" | "Long break";
const PRESET: Record<Mode, number> = { Focus: 25, "Short break": 5, "Long break": 15 };

export default function Focus() {
  const [db, update] = useDB();
  const [mode, setMode] = useState<Mode>("Focus"); const [mins, setMins] = useState(25);
  const [goalId, setGoalId] = useState(""); const [taskId, setTaskId] = useState("");
  const [endAt, setEndAt] = useState<number | null>(null); const [startAt, setStartAt] = useState(0);
  const [left, setLeft] = useState(0); const [dist, setDist] = useState(0); const [note, setNote] = useState("");
  const [pending, setPending] = useState<number | null>(null); const [err, setErr] = useState("");
  const stop = useRef<(early: boolean) => void>(() => {});
  stop.current = (early) => {
    const elapsed = Math.round((Math.min(Date.now(), endAt ?? Date.now()) - startAt) / 60000);
    setEndAt(null);
    if (mode === "Focus") setPending(Math.max(early ? elapsed : mins, 0));
  };
  useEffect(() => {
    if (!endAt) return;
    const t = setInterval(() => { const r = endAt - Date.now(); if (r <= 0) { setLeft(0); stop.current(false); } else setLeft(r); }, 500);
    return () => clearInterval(t);
  }, [endAt]);
  if (!db) return <p className="text-mute">Loading…</p>;
  const start = () => {
    if (!(mins >= 1 && mins <= 240)) return setErr("Choose 1 to 240 minutes.");
    setErr(""); setDist(0); setNote(""); setStartAt(Date.now()); setEndAt(Date.now() + mins * 60000); setLeft(mins * 60000);
  };
  const save = (completed: boolean) => {
    update((d) => ({ ...d, sessions: [...d.sessions, { id: uid(), goalId: goalId || undefined, taskId: taskId || undefined, date: dstr(new Date()), plannedMin: mins, actualMin: pending ?? 0, distractions: dist, completed, notes: note }],
      tasks: completed && taskId ? d.tasks.map((t) => (t.id === taskId ? { ...t, done: true } : t)) : d.tasks }));
    setPending(null);
  };
  const sec = Math.ceil(left / 1000);
  const open = db.tasks.filter((t) => !t.done && (!goalId || t.goalId === goalId));
  const hist = [...db.sessions].reverse().slice(0, 10);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Focus Mode</h1>
      <section className="card space-y-4 p-6 text-center">
        <div className="flex justify-center gap-2">{(Object.keys(PRESET) as Mode[]).map((m) => <button key={m} disabled={!!endAt} className={`btn ${mode === m ? "btn-primary" : ""}`} onClick={() => { setMode(m); setMins(PRESET[m]); }}>{m}</button>)}</div>
        <div className="text-6xl font-semibold tabular-nums" aria-live="off">{endAt ? `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}` : `${String(mins).padStart(2, "0")}:00`}</div>
        {!endAt && pending === null && (
          <div className="mx-auto grid max-w-md gap-2 text-left">
            <label className="text-sm text-mute">Minutes<input type="number" className="input" value={mins} onChange={(e) => setMins(Number(e.target.value))} /></label>
            {mode === "Focus" && <>
              <select className="input" value={goalId} onChange={(e) => { setGoalId(e.target.value); setTaskId(""); }}><option value="">No goal</option>{db.goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
              <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}><option value="">No specific task</option>{open.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></>}
            <button className="btn btn-primary justify-center" onClick={start}>Start {mode.toLowerCase()}</button>
            {err && <p className="text-sm text-warn">{err}</p>}
          </div>)}
        {endAt && <div className="flex justify-center gap-2">
          {mode === "Focus" && <button className="btn" onClick={() => setDist(dist + 1)}>Distraction ({dist})</button>}
          <button className="btn" onClick={() => stop.current(true)}>{mode === "Focus" ? "End early" : "Skip break"}</button></div>}
        {pending !== null && (
          <div className="mx-auto max-w-md space-y-2 text-left">
            <p>You focused for {pending} min with {dist} distraction{dist === 1 ? "" : "s"}. Did you complete what you intended?</p>
            <input className="input" placeholder="Session notes" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-2"><button className="btn btn-primary" onClick={() => save(true)}>Yes, completed</button><button className="btn" onClick={() => save(false)}>Not yet</button></div>
          </div>)}
      </section>
      <section>
        <h2 className="mb-2 font-medium">Recent sessions</h2>
        {hist.length === 0 ? <p className="text-sm text-mute">No sessions recorded yet.</p> : (
          <div className="card divide-y divide-line">{hist.map((s) => (
            <div key={s.id} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
              <span>{s.date} · {db.goals.find((g) => g.id === s.goalId)?.name ?? "No goal"}{s.notes ? ` · ${s.notes}` : ""}</span>
              <span className="text-mute">{s.actualMin}/{s.plannedMin} min · {s.distractions} distractions · {s.completed ? "completed" : "not completed"}</span>
            </div>))}</div>)}
      </section>
    </div>
  );
}
