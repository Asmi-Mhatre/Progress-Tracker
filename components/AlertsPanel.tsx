import Link from "next/link";
import { DB } from "@/lib/types";
import { activeAlerts, countdown } from "@/lib/remind";
import { dstr } from "@/lib/time";

export default function AlertsPanel({ db, now }: { db: DB; now: Date }) {
  const t = now.getTime(), today = dstr(now), soon = dstr(new Date(t + 14 * 864e5));
  const alerts = activeAlerts(db, t);
  const opp = db.opps.filter((o) => !["Rejected", "Withdrawn", "Accepted"].includes(o.status));
  const items = [
    ...opp.filter((o) => o.status === "Idea" && o.deadline && o.deadline <= soon).map((o) => `Apply: ${o.title} by ${o.deadline}`),
    ...opp.filter((o) => o.interviewAt && o.interviewAt.slice(0, 10) >= today && o.interviewAt.slice(0, 10) <= soon).map((o) => `Interview: ${o.title} on ${o.interviewAt!.replace("T", " ")}`),
    ...opp.filter((o) => o.followUp && o.followUp <= today).map((o) => `Follow up: ${o.title}${o.contact ? ` (${o.contact})` : ""}`),
  ];
  if (!alerts.length && !items.length) return null;
  return (
    <section className="card p-5">
      <div className="mb-2 flex justify-between"><h2 className="font-medium">Needs attention</h2><Link href="/reminders" className="text-sm text-accent">All reminders</Link></div>
      <ul className="space-y-1 text-sm">
        {alerts.map((r) => <li key={r.id} className="flex justify-between gap-2"><span>{r.title}</span><span className={new Date(r.dueAt).getTime() < t ? "text-warn" : "text-mute"}>{countdown(r.dueAt, t)}</span></li>)}
        {items.map((x) => <li key={x}>{x}</li>)}
      </ul>
    </section>
  );
}
