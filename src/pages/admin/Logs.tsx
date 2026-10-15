import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
type L = { id: string; action: string; entity: string; entity_id: string | null; details: Record<string, unknown>; created_at: string; profiles: { username: string } | null };
export default function Logs() {
  const [rows, setRows] = useState<L[]>([]); const [q, setQ] = useState("");
  useEffect(() => { supabase.from("admin_audit_logs").select("*, profiles(username)").order("created_at", { ascending: false }).limit(300).then(({ data }) => setRows((data ?? []) as unknown as L[])); }, []);
  const list = rows.filter((r) => `${r.action} ${r.entity} ${r.profiles?.username}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4"><h1 className="text-xl font-semibold">Admin Activity Logs</h1>
      <input className="input max-w-xs" placeholder="Filter by action, entity or admin" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card overflow-x-auto p-0"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500"><tr>{["Time", "Admin", "Action", "Entity", "Details"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>{list.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No activity yet.</td></tr>}
          {list.map((r) => (<tr key={r.id} className="border-t"><td className="whitespace-nowrap px-4 py-3">{new Date(r.created_at).toLocaleString()}</td><td className="px-4 py-3">{r.profiles?.username}</td>
            <td className="px-4 py-3">{r.action}</td><td className="px-4 py-3">{r.entity} <span className="text-xs text-slate-400">{r.entity_id?.slice(0, 8)}</span></td>
            <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{JSON.stringify(r.details)}</td></tr>))}</tbody></table></div></div>
  );
}
