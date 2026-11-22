"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { uid, useDB } from "@/lib/store";
import { examRisk, goalName, lastDays, missed, rangeStats } from "@/lib/analytics";
import { blocksOn, dstr, parse, sleepRanges } from "@/lib/time";
import { DayReview } from "@/lib/types";

const Q: [keyof DayReview, string][] = [["accomplished", "What did I accomplish?"], ["failed", "What did I fail to complete?"], ["why", "Why?"], ["learned", "What did I learn?"], ["improve", "What should I improve tomorrow?"]];
const h = (m: number) => (m / 60).toFixed(1);

export default function Reviews() {
  const [db, update] = useDB();
  const [date, setDate] = useState(dstr(new Date())); const [wk, setWk] = useState(dstr(new Date()));
  const [draft, setDraft] = useState<DayReview | null>(null); const [at, setAt] = useState(""); const [an, setAn] = useState(""); const [ad, setAd] = useState(dstr(new Date()));
  if (!db) return <p className="text-mute">Loading…</p>;
  const blank = (d: string): DayReview => ({ date: d, accomplished: "", failed: "", why: "", learned: "", improve: "", rating: 3 });
  const cur = draft && draft.date === date ? draft : db.reviews.find((r) => r.date === date) ?? blank(date);
  const save = () => { update((d) => ({ ...d, reviews: [...d.reviews.filter((r) => r.date !== date), cur] })); setDraft(null); };

  const end = new Date(parse(wk)); end.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7) - 1));
  const dates = lastDays(7, end), prevDates = lastDays(7, new Date(end.getTime() - 7 * 864e5)), today = dstr(new Date());
  const a = rangeStats(db, dates), b = rangeStats(db, prevDates);
  const keys = Array.from(new Set([...Object.keys(a.planned), ...Object.keys(a.actual), ...Object.keys(b.actual)]));
  const ratings = db.reviews.filter((r) => dates.includes(r.date));
  const miss = missed(db, dates), nextWeek = lastDays(7, new Date(end.getTime() + 7 * 864e5));
  const waking = 1440 - sleepRanges(db).reduce((s, [x, y]) => s + y - x, 0);
  const over = nextWeek.filter((d) => blocksOn(db, d).filter((x) => x.productive).reduce((s, x) => s + x.durMin, 0) > waking);
  const recs: string[] = [];
  db.goals.filter((g) => g.status === "active" && g.weight >= 4 && !(a.actual[g.id] > 0)).forEach((g) => recs.push(`Schedule time for ${g.name}: importance ${g.weight}, nothing recorded this week.`));
  if (a.plannedTotal && a.actualTotal < a.plannedTotal * 0.8) recs.push(`You logged ${Math.round((a.actualTotal / a.plannedTotal) * 100)}% of planned time. Plan fewer hours or protect your fixed blocks.`);
  db.exams.forEach((e) => { const x = examRisk(e, db.topics.filter((t) => t.examId === e.id), today); if (x) recs.push(`${e.name}: raise pace to ${x.need.toFixed(1)} topics per week (now ${x.pace.toFixed(1)}).`); });
  if (miss[0]) recs.push(`"${miss[0][0]}" was missed ${miss[0][1]} time${miss[0][1] > 1 ? "s" : ""}. Move it to a time that works or shorten it.`);
  if (over.length) recs.push(`Next week is overloaded on ${over.join(", ")}: planned productive time exceeds waking hours.`);
  const mocks = db.mocks.filter((m) => dates.includes(m.date)), openNext = db.tasks.filter((t) => !t.done && t.due && nextWeek.includes(t.due));
  const rems = db.reminders.filter((r) => !r.done && nextWeek.includes(r.dueAt.slice(0, 10)));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <section className="card space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">Daily review</h2>
        <input type="date" className="input w-auto" value={date} onChange={(e) => { setDate(e.target.value); setDraft(null); }} aria-label="Review date" /></div>
        {Q.map(([k, l]) => <label key={k} className="block text-sm text-mute">{l}<textarea className="input mt-1" rows={2} value={cur[k] as string} onChange={(e) => setDraft({ ...cur, [k]: e.target.value })} /></label>)}
        <div className="flex flex-wrap items-center gap-3 text-sm"><span className="text-mute">Execution rating</span>
          {[1, 2, 3, 4, 5].map((n) => <button key={n} className={`btn ${cur.rating === n ? "btn-primary" : ""}`} onClick={() => setDraft({ ...cur, rating: n })}>{n}</button>)}
          <button className="btn btn-primary ml-auto" onClick={save}>Save review</button></div>
        <p className="text-xs text-mute">Rate how well you executed the plan, not how many hours you spent.</p></section>

      <section className="card space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">Weekly report: {dates[0]} to {dates[6]}</h2>
        <input type="date" className="input w-auto" value={wk} onChange={(e) => e.target.value && setWk(e.target.value)} aria-label="Any date in the week" /></div>
        <table className="w-full text-sm"><thead className="text-left text-xs text-mute"><tr><th>Goal</th><th>Planned</th><th>Actual</th><th>Previous week</th><th>Change</th></tr></thead>
          <tbody>{keys.map((k) => { const d = (a.actual[k] ?? 0) - (b.actual[k] ?? 0); return <tr key={k} className="border-t border-line"><td>{goalName(db, k)}</td><td>{h(a.planned[k] ?? 0)}</td><td>{h(a.actual[k] ?? 0)}</td><td>{h(b.actual[k] ?? 0)}</td><td className={d < 0 ? "text-warn" : ""}>{d > 0 ? "+" : ""}{h(d)}</td></tr>; })}
            <tr className="border-t border-line font-medium"><td>Total (h)</td><td>{h(a.plannedTotal)}</td><td>{h(a.actualTotal)}</td><td>{h(b.actualTotal)}</td><td>{h(a.actualTotal - b.actualTotal)}</td></tr></tbody></table>
        {keys.length === 0 && <p className="text-sm text-mute">No planned or logged time this week.</p>}
        <div className="space-y-1 text-sm">
          <p>{ratings.length ? `Average execution rating ${(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)} over ${ratings.length} reviewed day${ratings.length > 1 ? "s" : ""}.` : "No daily reviews this week."}</p>
          <p>{mocks.length ? `Mocks: ${mocks.map((m) => m.name).join(", ")}.` : "No mocks recorded this week."} {db.achievements.filter((x) => dates.includes(x.date)).map((x) => `Achievement: ${x.title}.`).join(" ")}</p>
          <p className="text-mute">Next week: {openNext.length} open tasks due, {rems.length} reminder deadlines.{rems.length ? ` ${rems.map((r) => r.title).join(", ")}.` : ""}</p></div>
        <div><h3 className="mb-1 text-sm font-medium">Recommended adjustments</h3>{recs.length === 0 ? <p className="text-sm text-mute">Nothing flagged from this week's data.</p> : <ul className="list-disc space-y-1 pl-5 text-sm">{recs.map((x) => <li key={x}>{x}</li>)}</ul>}</div>
      </section>

      <section className="card space-y-3 p-5"><h2 className="font-medium">Achievement timeline</h2>
        <div className="flex flex-wrap gap-2"><input type="date" className="input w-auto" value={ad} onChange={(e) => setAd(e.target.value)} aria-label="Date" /><input className="input min-w-40 flex-1" placeholder="Exam passed, certificate, project shipped…" value={at} onChange={(e) => setAt(e.target.value)} /><input className="input min-w-32 flex-1" placeholder="Note" value={an} onChange={(e) => setAn(e.target.value)} />
          <button className="btn btn-primary" onClick={() => { if (at.trim() && ad) { update((d) => ({ ...d, achievements: [...d.achievements, { id: uid(), date: ad, title: at.trim(), note: an }] })); setAt(""); setAn(""); } }}>Add</button></div>
        {[...db.achievements].sort((x, y) => y.date.localeCompare(x.date)).map((x) => <div key={x.id} className="flex items-center justify-between text-sm"><span>{x.date} · {x.title}{x.note ? ` · ${x.note}` : ""}</span>
          <button className="btn py-0.5" aria-label={`Delete ${x.title}`} onClick={() => update((d) => ({ ...d, achievements: d.achievements.filter((y) => y.id !== x.id) }))}><Trash2 size={12} /></button></div>)}
      </section>
    </div>
  );
}
