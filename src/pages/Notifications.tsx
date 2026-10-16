import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
type N = { id: string; title: string; body: string; link: string | null; is_read: boolean; created_at: string };
export default function Notifications() {
  const { profile } = useAuth(); const [rows, setRows] = useState<N[]>([]);
  const load = () => { if (profile) supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100).then(({ data }) => setRows((data ?? []) as N[])); };
  useEffect(() => { load(); }, [profile?.id]);
  async function markAll() { if (!profile) return; await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false); load(); }
  async function mark(id: string) { await supabase.from("notifications").update({ is_read: true }).eq("id", id); load(); }
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Notifications</h1>
        {rows.some((r) => !r.is_read) && <button className="text-sm text-brand-600" onClick={markAll}>Mark all as read</button>}</div>
      {rows.length === 0 ? <p className="card text-slate-500">No notifications.</p> : <div className="card divide-y p-0">{rows.map((n) => (
        <div key={n.id} className={`flex items-start justify-between gap-3 px-4 py-3 text-sm ${n.is_read ? "" : "bg-brand-50"}`}>
          <div><div className="font-medium">{n.title}</div><div className="text-slate-600">{n.body}</div>
            <div className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}{n.link && <> · <Link to={n.link} className="text-brand-600" onClick={() => mark(n.id)}>View</Link></>}</div></div>
          {!n.is_read && <button className="whitespace-nowrap text-xs text-slate-500" onClick={() => mark(n.id)}>Mark read</button>}</div>))}</div>}
    </div>
  );
}
