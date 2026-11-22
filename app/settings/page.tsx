"use client";
import { useState } from "react";
import { normalize, replaceDB, useDB } from "@/lib/store";
import MvdEditor from "@/components/MvdEditor";
import { DB } from "@/lib/types";

export default function Settings() {
  const [db] = useDB();
  const [msg, setMsg] = useState("");
  if (!db) return <p className="text-mute">Loading…</p>;
  const exportData = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `life-os-backup-${new Date().toLocaleDateString("en-CA")}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importData = async (f: File | undefined) => {
    if (!f) return;
    try {
      const d = JSON.parse(await f.text()) as DB;
      if (!Array.isArray(d.goals) || !Array.isArray(d.tasks)) throw new Error("bad shape");
      if (!confirm("Replace all current data with this backup?")) return;
      replaceDB(normalize(d)); setMsg("Backup restored.");
    } catch { setMsg("That file is not a valid Life OS backup."); }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="card space-y-3 p-5">
        <h2 className="font-medium">Backup and restore</h2>
        <p className="text-sm text-mute">Data is stored in this browser only. Export a backup regularly; clearing site data deletes it.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" onClick={exportData}>Export JSON</button>
          <input type="file" accept="application/json" onChange={(e) => importData(e.target.files?.[0])} aria-label="Import backup" />
        </div>
        {msg && <p className="text-sm">{msg}</p>}
      </section>
      <MvdEditor />
    </div>
  );
}
