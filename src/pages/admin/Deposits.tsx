import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPKR } from "../../lib/money";
import { friendlyError } from "../../lib/errors";
import StatusBadge from "../../components/StatusBadge";
type Dep = { id: string; method: string; amount: number; trx_id: string; status: string; admin_note: string | null; created_at: string; reviewed_at: string | null; profiles: { username: string; email: string } | null };
const ST: Record<string, string> = { pending: "pending", approved: "completed", rejected: "cancelled" };
export default function Deposits() {
  const [rows, setRows] = useState<Dep[]>([]); const [fs, setFs] = useState("pending"); const [q, setQ] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState("");
  const load = () => supabase.from("deposit_requests").select("*, profiles!user_id(username,email)").order("created_at", { ascending: false }).limit(300).then(({ data, error }) => { if (error) setErr(error.message); setRows((data ?? []) as unknown as Dep[]); });
  useEffect(() => { load(); }, []);
  async function act(d: Dep, kind: "approve" | "reject") {
    setErr("");
    let note: string | null = null;
    if (kind === "approve") { if (!confirm(`Approve ${formatPKR(d.amount)} for ${d.profiles?.username}?\n\nFirst confirm in your ${d.method} app that TID ${d.trx_id} was received.`)) return; }
    else { note = prompt("Reason for rejecting (shown to the customer):"); if (note === null) return; }
    setBusy(d.id);
    const { error } = await supabase.rpc(kind === "approve" ? "approve_deposit" : "reject_deposit", { p_id: d.id, p_note: note });
    setBusy(""); if (error) setErr(friendlyError(error.message)); load();
  }
  const list = rows.filter((r) => (!fs || r.status === fs) && (`${r.profiles?.username} ${r.profiles?.email} ${r.trx_id}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Deposit Requests</h1>
      <p className="text-sm text-slate-500">Verify each payment manually in your EasyPaisa/JazzCash app before approving. Approval credits the wallet once.</p>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search user, email or TID" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[160px]" value={fs} onChange={(e) => setFs(e.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
      </div>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      <div className="card overflow-x-auto p-0"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500"><tr>{["Date", "Customer", "Method", "Amount", "TID", "Status", "Note", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">No requests.</td></tr>}
          {list.map((d) => (
            <tr key={d.id} className="border-t"><td className="whitespace-nowrap px-4 py-3">{new Date(d.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">{d.profiles?.username}<div className="text-xs text-slate-500">{d.profiles?.email}</div></td>
              <td className="px-4 py-3">{d.method}</td><td className="px-4 py-3">{formatPKR(d.amount)}</td><td className="px-4 py-3">{d.trx_id}</td>
              <td className="px-4 py-3"><StatusBadge status={ST[d.status]} /> <span className="text-xs">{d.status}</span></td><td className="px-4 py-3">{d.admin_note ?? ""}</td>
              <td className="space-x-3 whitespace-nowrap px-4 py-3">{d.status === "pending" && <>
                <button disabled={busy === d.id} className="text-green-700" onClick={() => act(d, "approve")}>Approve</button>
                <button disabled={busy === d.id} className="text-red-600" onClick={() => act(d, "reject")}>Reject</button></>}</td></tr>))}
        </tbody></table></div>
    </div>
  );
}
