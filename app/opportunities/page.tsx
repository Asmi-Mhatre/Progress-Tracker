"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";
import { OPP_STATUS, OPP_TYPES, Opportunity } from "@/lib/types";

export default function Opportunities() {
  const [db, update] = useDB();
  const blank = { type: "Job" as Opportunity["type"], title: "", org: "", status: "Idea" as Opportunity["status"], deadline: "", interviewAt: "", followUp: "", contact: "", url: "", notes: "" };
  const [f, setF] = useState(blank); const [fs, setFs] = useState(""); const [err, setErr] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const add = () => {
    if (!f.title.trim()) return setErr("Enter a title.");
    if (f.url && !/^https?:\/\//.test(f.url)) return setErr("Website must start with http:// or https://");
    setErr(""); update((d) => ({ ...d, opps: [...d.opps, { id: uid(), ...f, title: f.title.trim(), deadline: f.deadline || undefined, interviewAt: f.interviewAt || undefined, followUp: f.followUp || undefined }] }));
    setF(blank);
  };
  const patch = (id: string, p: Partial<Opportunity>) => update((d) => ({ ...d, opps: d.opps.map((o) => (o.id === id ? { ...o, ...p } : o)) }));
  const list = db.opps.filter((o) => !fs || o.status === fs).sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  const field = (k: "deadline" | "followUp", l: string) => <label className="text-xs text-mute">{l}<input type="date" className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Opportunities</h1>
      <div className="flex flex-wrap gap-2"><button className={`btn ${!fs ? "btn-primary" : ""}`} onClick={() => setFs("")}>All ({db.opps.length})</button>
        {OPP_STATUS.map((s) => <button key={s} className={`btn ${fs === s ? "btn-primary" : ""}`} onClick={() => setFs(s)}>{s} ({db.opps.filter((o) => o.status === s).length})</button>)}</div>
      <section className="card grid gap-2 p-4 md:grid-cols-6">
        <h2 className="font-medium md:col-span-6">Add opportunity</h2>
        <select className="input md:col-span-2" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Opportunity["type"] })}>{OPP_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <input className="input md:col-span-2" placeholder="Role / program" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Organisation" value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} />
        <select className="input md:col-span-2" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Opportunity["status"] })}>{OPP_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <div className="md:col-span-2">{field("deadline", "Application deadline")}</div>
        <label className="text-xs text-mute md:col-span-2">Interview<input type="datetime-local" className="input" value={f.interviewAt} onChange={(e) => setF({ ...f, interviewAt: e.target.value })} /></label>
        <div className="md:col-span-2">{field("followUp", "Follow-up date")}</div>
        <input className="input md:col-span-2" placeholder="Contact / referral" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} />
        <input className="input md:col-span-4" placeholder="Website URL" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <input className="input md:col-span-6" placeholder="Notes and interview preparation" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        <button className="btn btn-primary justify-center md:col-span-6" onClick={add}>Add opportunity</button>
        {err && <p className="text-sm text-warn md:col-span-6">{err}</p>}
      </section>
      {list.length === 0 ? <p className="text-mute">No opportunities yet.</p> : (
        <div className="card divide-y divide-line">{list.map((o) => (
          <div key={o.id} className="space-y-1 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-40 flex-1"><div>{o.title}{o.org ? ` · ${o.org}` : ""}</div><div className="text-xs text-mute">{o.type}{o.contact ? ` · ${o.contact}` : ""}{o.url && <> · <a className="text-accent" href={o.url} target="_blank" rel="noopener noreferrer">Website</a></>}</div></div>
              <select className="input w-auto" value={o.status} onChange={(e) => patch(o.id, { status: e.target.value as Opportunity["status"] })} aria-label="Status">{OPP_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
              <input type="date" className="input w-auto" value={o.deadline ?? ""} onChange={(e) => patch(o.id, { deadline: e.target.value || undefined })} aria-label="Deadline" />
              <input type="datetime-local" className="input w-auto" value={o.interviewAt ?? ""} onChange={(e) => patch(o.id, { interviewAt: e.target.value || undefined })} aria-label="Interview" />
              <input type="date" className="input w-auto" value={o.followUp ?? ""} onChange={(e) => patch(o.id, { followUp: e.target.value || undefined })} aria-label="Follow-up" />
              <button className="btn py-0.5" aria-label={`Delete ${o.title}`} onClick={() => confirm(`Delete ${o.title}?`) && update((d) => ({ ...d, opps: d.opps.filter((x) => x.id !== o.id) }))}><Trash2 size={13} /></button>
            </div>
            {o.notes && <div className="text-xs text-mute">{o.notes}</div>}
          </div>))}</div>)}
    </div>
  );
}
