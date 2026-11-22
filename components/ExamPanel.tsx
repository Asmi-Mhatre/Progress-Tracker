import { DB } from "@/lib/types";
import { parse } from "@/lib/time";

export const daysUntil = (d: string, today: string) => Math.round((parse(d).getTime() - parse(today).getTime()) / 864e5);
const LABELS = { regOpen: "Registration opens", regDeadline: "Registration deadline", admitDate: "Admit card", examDate: "Exam", resultDate: "Result" } as const;

export default function ExamPanel({ db, today }: { db: DB; today: string }) {
  const up = db.exams.flatMap((e) => (Object.keys(LABELS) as (keyof typeof LABELS)[]).flatMap((k) => { const v = e[k]; return v && v >= today ? [{ e, label: LABELS[k], v }] : []; }))
    .sort((a, b) => a.v.localeCompare(b.v)).slice(0, 4);
  const recent = db.mocks.filter((m) => m.score !== undefined || m.percentile !== undefined).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card p-5">
        <h2 className="mb-3 font-medium">Upcoming exam dates</h2>
        {up.length === 0 ? <p className="text-sm text-mute">No exam dates set. Add them under Examinations.</p> : (
          <ul className="space-y-1 text-sm">{up.map((u, i) => <li key={i} className="flex justify-between"><span>{u.e.name}: {u.label}</span><span className="text-mute">{u.v} ({daysUntil(u.v, today)} d)</span></li>)}</ul>)}
      </section>
      <section className="card p-5">
        <h2 className="mb-3 font-medium">Recent mocks</h2>
        {recent.length === 0 ? <p className="text-sm text-mute">No mock results entered yet.</p> : (
          <ul className="space-y-1 text-sm">{recent.map((m) => <li key={m.id} className="flex justify-between"><span>{m.name}</span>
            <span className="text-mute">{m.score !== undefined ? `${m.score}${m.maxScore ? `/${m.maxScore}` : ""}` : ""}{m.percentile !== undefined ? ` · ${m.percentile}%ile` : ""}</span></li>)}</ul>)}
      </section>
    </div>
  );
}
