import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import StatusBadge from "../components/StatusBadge";
import TicketThread from "../components/TicketThread";
type T = { id: string; subject: string; status: string; updated_at: string };
const ST: Record<string, string> = { open: "pending", answered: "completed", closed: "cancelled" };
export default function Support() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<T[]>([]); const [selId, setSelId] = useState(""); const [ver, setVer] = useState(0);
  const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [reply, setReply] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const load = () => { if (profile) supabase.from("support_tickets").select("id,subject,status,updated_at").eq("user_id", profile.id).order("updated_at", { ascending: false }).then(({ data }) => setTickets((data ?? []) as T[])); };
  useEffect(() => { load(); }, [profile?.id]);
  const sel = tickets.find((t) => t.id === selId);

  async function create() {
    if (!profile) return; setErr("");
    if (subject.trim().length < 3) return setErr("Enter a subject (at least 3 characters).");
    if (body.trim().length < 1) return setErr("Enter your message.");
    setBusy(true);
    const { data, error } = await supabase.from("support_tickets").insert({ user_id: profile.id, subject: subject.trim() }).select("id").single();
    if (error || !data) { setBusy(false); return setErr(error?.message ?? "Could not create ticket."); }
    const m = await supabase.from("support_messages").insert({ ticket_id: data.id, sender_id: profile.id, is_admin: false, body: body.trim() });
    setBusy(false); if (m.error) return setErr(m.error.message);
    setSubject(""); setBody(""); load(); setSelId(data.id); setVer(ver + 1);
  }
  async function send() {
    if (!profile || !sel) return; setErr("");
    if (reply.trim().length < 1) return;
    setBusy(true);
    const m = await supabase.from("support_messages").insert({ ticket_id: sel.id, sender_id: profile.id, is_admin: false, body: reply.trim() });
    if (!m.error) await supabase.from("support_tickets").update({ status: "open" }).eq("id", sel.id);
    setBusy(false); if (m.error) return setErr(m.error.message);
    setReply(""); setVer(ver + 1); load();
  }
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Support Tickets</h1>
      <div className="card space-y-3"><h2 className="font-medium">New ticket</h2>
        <input className="input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="input" rows={3} placeholder="Describe your issue" value={body} onChange={(e) => setBody(e.target.value)} />
        {err && !sel && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button className="btn" disabled={busy} onClick={create}>Submit ticket</button></div>
      <div className="card p-0">{tickets.length === 0 ? <p className="p-4 text-sm text-slate-500">No tickets yet.</p> : tickets.map((t) => (
        <button key={t.id} onClick={() => setSelId(t.id)} className={`flex w-full items-center justify-between border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50 ${t.id === selId ? "bg-brand-50" : ""}`}>
          <span>{t.subject}</span><span className="flex items-center gap-2"><StatusBadge status={ST[t.status]} /><span className="text-xs">{t.status}</span></span></button>))}</div>
      {sel && <div className="card space-y-3"><h2 className="font-semibold">{sel.subject}</h2><TicketThread ticketId={sel.id} version={ver} />
        {sel.status === "closed" ? <p className="text-sm text-slate-500">This ticket is closed. Open a new ticket if you need more help.</p> : <>
          <textarea className="input" rows={2} placeholder="Reply" value={reply} onChange={(e) => setReply(e.target.value)} />
          {err && <p role="alert" className="text-sm text-red-600">{err}</p>}<button className="btn" disabled={busy} onClick={send}>Send reply</button></>}</div>}
    </div>
  );
}
