"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";
import { countdown, nextDue, toInput } from "@/lib/remind";
import { Reminder } from "@/lib/types";

const PRESET = [30, 14, 7, 3, 1, 0];
const PRI = ["", "High", "Medium", "Low"];
type Tab = "upcoming" | "overdue" | "done" | "calendar";

export default function Reminders() {
  const [db, update] = useDB();
  const [tab, setTab] = useState<Tab>("upcoming"); const [perm, setPerm] = useState("unsupported"); const [err, setErr] = useState("");
  const blank = { title: "", description: "", goalId: "", dueAt: "", priority: 2 as 1 | 2 | 3, offsets: [7, 1, 0], custom: "", recur: "none" as Reminder["recur"], url: "", docs: "", notes: "" };
  const [f, setF] = useState(blank);
  useEffect(() => { if (typeof Notification !== "undefined") setPerm(Notification.permission); }, []);
  if (!db) return <p className="text-mute">Loading…</p>;
  const now = Date.now();
  const enable = async () => { if (typeof Notification !== "undefined") setPerm(await Notification.requestPermission()); };
  const add = () => {
    if (!f.title.trim()) return setErr("Enter a title.");
    if (!f.dueAt) return setErr("Choose the deadline date and time.");
    const extra = f.custom.split(",").map((x) => x.trim()).filter(Boolean).map(Number);
    if (extra.some((n) => !Number.isInteger(n) || n < 0 || n > 365)) return setErr("Custom alerts must be whole days between 0 and 365, separated by commas.");
    const offsets = Array.from(new Set([...f.offsets, ...extra])).sort((a, b) => b - a);
    if (!offsets.length) return setErr("Pick at least one alert.");
    if (f.url && !/^https?:\/\//.test(f.url)) return setErr("Website must start with http:// or https://");
    setErr("");
    update((d) => ({ ...d, reminders: [...d.reminders, { id: uid(), title: f.title.trim(), description: f.description, goalId: f.goalId || undefined, dueAt: f.dueAt, priority: f.priority, offsets, recur: f.recur, done: false, notes: f.notes, url: f.url, docs: f.docs, fired: [] }] }));
    setF({ ...blank, dueAt: "" });
  };
  const patch = (id: string, p: Partial<Reminder>) => update((d) => ({ ...d, reminders: d.reminders.map((r) => (r.id === id ? { ...r, ...p } : r)) }));
  const complete = (r: Reminder) => r.recur === "none" ? patch(r.id, { done: true }) : patch(r.id, { dueAt: nextDue(r, now), fired: [] });
  const list = db.reminders.filter((r) => tab === "done" ? r.done : !r.done && (tab === "overdue" ? new Date(r.dueAt).getTime() < now : tab === "upcoming" ? new Date(r.dueAt).getTime() >= now : true))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const months = Array.from(new Set(list.map((r) => r.dueAt.slice(0, 7))));
  const row = (r: Reminder) => (
    <div key={r.id} className="space-y-1 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input type="checkbox" checked={r.done} aria-label={`Complete ${r.title}`} onChange={(e) => (e.target.checked ? complete(r) : patch(r.id, { done: false }))} />
        <div className="min-w-40 flex-1"><div className={r.done ? "text-mute line-through" : ""}>{r.title} <span className="text-xs text-mute">{PRI[r.priority]}{r.recur !== "none" ? ` · repeats ${r.recur}` : ""}</span></div>
          <div className="text-xs text-mute">{db.goals.find((g) => g.id === r.goalId)?.name ?? "No goal"} · alerts {r.offsets.map((o) => (o === 0 ? "on day" : `${o}d`)).join(", ")}</div></div>
        <span className={new Date(r.dueAt).getTime() < now && !r.done ? "text-warn" : "text-mute"}>{!r.done && countdown(r.dueAt, now)}</span>
        <input type="datetime-local" className="input w-auto" value={r.dueAt} onChange={(e) => e.target.value && patch(r.id, { dueAt: e.target.value, fired: [] })} aria-label="Deadline" />
        <button className="btn py-0.5" aria-label={`Delete ${r.title}`} onClick={() => confirm(`Delete ${r.title}?`) && update((d) => ({ ...d, reminders: d.reminders.filter((x) => x.id !== r.id) }))}><Trash2 size={13} /></button>
      </div>
      {(r.description || r.notes || r.url || r.docs) && <div className="pl-6 text-xs text-mute">{[r.description, r.notes, r.docs].filter(Boolean).join(" · ")} {r.url && <a className="text-accent" href={r.url} target="_blank" rel="noopener noreferrer">Open website</a>}</div>}
    </div>);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reminders</h1>
      <section className="card space-y-1 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><span>Browser notifications: <b>{perm === "unsupported" ? "not supported here" : perm}</b></span>
          {perm === "default" && <button className="btn btn-primary" onClick={enable}>Enable notifications</button>}</div>
        <p className="text-mute">Alerts fire only while Life OS is open in a browser tab or installed app. There is no server pushing messages, so a closed browser will not notify you. Anything that came due meanwhile appears under Needs attention on the dashboard when you next open the app. Alerts for deadlines run at 09:00 on the alert day, or at the exact time for "on day". If permission is blocked, change it in your browser's site settings. Some mobile browsers do not support notifications unless the app is installed.</p>
      </section>
      <section className="card grid gap-2 p-4 md:grid-cols-6">
        <h2 className="font-medium md:col-span-6">New reminder</h2>
        <input className="input md:col-span-4" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input type="datetime-local" className="input md:col-span-2" value={f.dueAt} onChange={(e) => setF({ ...f, dueAt: e.target.value })} aria-label="Deadline" />
        <select className="input md:col-span-2" value={f.goalId} onChange={(e) => setF({ ...f, goalId: e.target.value })}><option value="">No goal</option>{db.goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <select className="input md:col-span-2" value={f.priority} onChange={(e) => setF({ ...f, priority: Number(e.target.value) as 1 | 2 | 3 })}><option value={1}>High</option><option value={2}>Medium</option><option value={3}>Low</option></select>
        <select className="input md:col-span-2" value={f.recur} onChange={(e) => setF({ ...f, recur: e.target.value as Reminder["recur"] })}><option value="none">One-time</option><option value="weekly">Repeats weekly</option><option value="monthly">Repeats monthly</option><option value="yearly">Repeats yearly</option></select>
        <div className="flex flex-wrap items-center gap-1 md:col-span-6"><span className="text-xs text-mute">Alert days before:</span>
          {PRESET.map((o) => <button key={o} className={`btn py-0.5 ${f.offsets.includes(o) ? "btn-primary" : ""}`} onClick={() => setF({ ...f, offsets: f.offsets.includes(o) ? f.offsets.filter((x) => x !== o) : [...f.offsets, o] })}>{o === 0 ? "On day" : o}</button>)}
          <input className="input w-40" placeholder="Custom, e.g. 10, 45" value={f.custom} onChange={(e) => setF({ ...f, custom: e.target.value })} /></div>
        <input className="input md:col-span-3" placeholder="Website URL" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <input className="input md:col-span-3" placeholder="Supporting documents or links" value={f.docs} onChange={(e) => setF({ ...f, docs: e.target.value })} />
        <input className="input md:col-span-3" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <input className="input md:col-span-3" placeholder="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        <button className="btn btn-primary justify-center md:col-span-6" onClick={add}>Add reminder</button>
        {err && <p className="text-sm text-warn md:col-span-6">{err}</p>}
      </section>
      <div className="flex gap-2">{(["upcoming", "overdue", "done", "calendar"] as Tab[]).map((t) => <button key={t} className={`btn ${tab === t ? "btn-primary" : ""}`} onClick={() => setTab(t)}>{t === "done" ? "Completed" : t === "calendar" ? "Calendar" : t[0].toUpperCase() + t.slice(1)}</button>)}</div>
      {list.length === 0 ? <p className="text-mute">Nothing here.</p> : tab === "calendar" ? months.map((m) => (
        <section key={m}><h2 className="mb-1 text-sm font-medium text-mute">{new Date(m + "-01T00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
          <div className="card divide-y divide-line">{list.filter((r) => r.dueAt.startsWith(m)).map((r) => <div key={r.id} className="flex justify-between gap-2 p-3 text-sm"><span>{r.title}</span><span className="text-mute">{r.dueAt.replace("T", " ")}</span></div>)}</div></section>
      )) : <div className="card divide-y divide-line">{list.map(row)}</div>}
    </div>
  );
}
