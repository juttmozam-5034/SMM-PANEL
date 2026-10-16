import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
type M = { id: string; is_admin: boolean; body: string; created_at: string };
export default function TicketThread({ ticketId, version }: { ticketId: string; version: number }) {
  const [msgs, setMsgs] = useState<M[]>([]);
  useEffect(() => { supabase.from("support_messages").select("id,is_admin,body,created_at").eq("ticket_id", ticketId).order("created_at").then(({ data }) => setMsgs((data ?? []) as M[])); }, [ticketId, version]);
  return <div className="space-y-2">{msgs.map((m) => (
    <div key={m.id} className={`max-w-[90%] whitespace-pre-wrap rounded-lg p-3 text-sm ${m.is_admin ? "bg-brand-50" : "ml-auto bg-slate-100"}`}>
      <div className="mb-1 text-xs text-slate-500">{m.is_admin ? "Support" : "Customer"} · {new Date(m.created_at).toLocaleString()}</div>{m.body}</div>))}</div>;
}
