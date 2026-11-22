"use client";
import { useEffect, useRef } from "react";
import { useDB } from "@/lib/store";
import { triggerAt } from "@/lib/remind";

export default function NotifyEngine() {
  const [db, update] = useDB();
  const ref = useRef(db); ref.current = db;
  const loaded = db !== null;
  useEffect(() => {
    if (!loaded) return;
    const tick = () => {
      const d = ref.current;
      if (!d || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = Date.now(); const due: { id: string; key: string; title: string; off: number }[] = [];
      d.reminders.forEach((r) => { if (!r.done) r.offsets.forEach((o) => { if (!r.fired.includes(String(o)) && triggerAt(r, o) <= now) due.push({ id: r.id, key: String(o), title: r.title, off: o }); }); });
      if (!due.length) return;
      try {
        if (due.length === 1) new Notification(due[0].title, { body: due[0].off === 0 ? "Deadline reached" : `Deadline in ${due[0].off} day${due[0].off > 1 ? "s" : ""}` });
        else new Notification(`${due.length} reminders need attention`, { body: due.slice(0, 3).map((x) => x.title).join(", ") });
      } catch { return; }
      update((dd) => ({ ...dd, reminders: dd.reminders.map((r) => ({ ...r, fired: [...r.fired, ...due.filter((x) => x.id === r.id).map((x) => x.key)] })) }));
    };
    tick(); const t = setInterval(tick, 30000); return () => clearInterval(t);
  }, [loaded, update]);
  return null;
}
