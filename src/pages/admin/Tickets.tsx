import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { friendlyError } from "../../lib/errors";
import StatusBadge from "../../components/StatusBadge";
import TicketThread from "../../components/TicketThread";
type T = { id: string; subject: string; status: string; updated_at: string; profiles: { username: string; email: string } | null };
const ST: Record<string, string> = { open: "pending", answered: "completed", closed: "cancelled" };
export default function AdminTickets() {
  const [rows, setRows] = useState<T[]>([]); const [fs, setFs] = useState("open"); const [selId, setSelId] = useState(""); const [ver, setVer] = useState(0);
  const [reply, setReply] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const load = () => supabase.from("support_tickets").select("id,subject,status,updated_at,profiles(username,email)").order("updated_at", { ascending: false }).limit(200).then(({ data }) => setRows((data ?? []) as unknown as T[]));
  useEffect(() => { load(); }, []);
  const sel = rows.find((r) => r.id === selId); const list = rows.filter((r) => !fs || r.status === fs);
  async function send() {
    if (!sel) return; setErr(""); setBusy(true);
    const { error } = await supabase.rpc("admin_reply_ticket", { p_ticket: sel.id, p_body: reply });
    setBusy(false); if (error) return setErr(friendlyError(error.message) + " (Run 0006_support.sql if this is the first time.)");
    setReply(""); setVer(ver + 1); load();
  }
  async function setStatus(status: string) {
    if (!sel) return; const { error } = await supabase.rpc("admin_set_ticket_status", { p_ticket: sel.id, p_status: status });
    if (error) return setErr(friendlyError(error.message)); load();
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Support Tickets</h1>
      <select className="input max-w-[160px]" value={fs} onChange={(e) => setFs(e.target.value)}><option value="">All</option><option value="open">Open</option><option value="answered">Answered</option><option value="closed">Closed</option></select>
      <div className="card p-0">{list.length === 0 ? <p className="p-4 text-sm text-slate-500">No tickets.</p> : list.map((t) => (
        <button key={t.id} onClick={() => { setSelId(t.id); setErr(""); }} className={`flex w-full items-center justify-between border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50 ${t.id === selId ? "bg-brand-50" : ""}`}>
          <span>{t.subject}<span className="block text-xs text-slate-500">{t.profiles?.username} · {t.profiles?.email}</span></span>
          <span className="flex items-center gap-2"><StatusBadge status={ST[t.status]} /><span className="text-xs">{t.status}</span></span></button>))}</div>
      {sel && <div className="card space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold">{sel.subject}</h2>
          <span className="flex gap-3 text-sm">{sel.status !== "closed" ? <button className="text-red-600" onClick={() => setStatus("closed")}>Close ticket</button> : <button className="text-brand-600" onClick={() => setStatus("open")}>Reopen</button>}</span></div>
        <TicketThread ticketId={sel.id} version={ver} />
        {sel.status !== "closed" && <><textarea className="input" rows={3} placeholder="Reply to customer" value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="btn" disabled={busy || !reply.trim()} onClick={send}>Send reply</button></>}
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}</div>}
    </div>
  );
}
