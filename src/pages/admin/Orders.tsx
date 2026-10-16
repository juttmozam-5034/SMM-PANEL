import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPKR } from "../../lib/money";
import { friendlyError } from "../../lib/errors";
import StatusBadge from "../../components/StatusBadge";
type O = { id: string; order_no: number; user_id: string; service_name: string; platform_name: string; target_url: string; quantity: number; total_price: number; status: string;
  admin_notes: string | null; provider_name: string | null; provider_order_id: string | null; refunded_amount: number; details: string | null; created_at: string; profiles: { username: string; email: string } | null };
const STATUSES = ["pending", "processing", "in_progress", "completed", "partial", "cancelled", "refunded"];
const FINAL = ["cancelled", "refunded", "partial"];

export default function AdminOrders() {
  const [rows, setRows] = useState<O[]>([]); const [fs, setFs] = useState(""); const [q, setQ] = useState(""); const [userId, setUserId] = useState("");
  const [selId, setSelId] = useState(""); const [notes, setNotes] = useState(""); const [pn, setPn] = useState(""); const [pid, setPid] = useState("");
  const [ns, setNs] = useState(""); const [refund, setRefund] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const load = () => supabase.from("orders").select("*, profiles(username,email)").order("created_at", { ascending: false }).limit(300).then(({ data }) => setRows((data ?? []) as unknown as O[]));
  useEffect(() => { load(); }, []);
  const sel = rows.find((r) => r.id === selId);
  useEffect(() => { if (sel) { setNotes(sel.admin_notes ?? ""); setPn(sel.provider_name ?? ""); setPid(sel.provider_order_id ?? ""); setNs(""); setRefund(""); setMsg(""); setErr(""); } }, [selId]);

  const list = rows.filter((r) => (!fs || r.status === fs) && (!userId || r.user_id === userId) &&
    `${r.order_no} ${r.profiles?.username} ${r.profiles?.email} ${r.service_name}`.toLowerCase().includes(q.toLowerCase()));
  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => setMsg("Copied."));
  const info = (o: O) => `Order #${o.order_no}\nService: ${o.service_name} (${o.platform_name})${o.target_url ? `\nLink: ${o.target_url}` : ""}\nQuantity: ${o.quantity}${o.details ? `\nDetails: ${o.details}` : ""}`;

  async function saveDetails() {
    if (!sel) return; setBusy(true); setErr(""); setMsg("");
    const { error } = await supabase.rpc("update_order_details", { p_order: sel.id, p_notes: notes, p_provider: pn.trim() || null, p_provider_order: pid.trim() || null });
    setBusy(false); if (error) return setErr(friendlyError(error.message)); setMsg("Saved."); load();
  }
  async function changeStatus() {
    if (!sel || !ns) return; setErr(""); setMsg("");
    const left = sel.total_price - sel.refunded_amount; let r: number | null = null;
    if (ns === "partial") { r = parseFloat(refund); if (!(r > 0) || r > left) return setErr(`Enter a refund amount between 0.01 and ${left.toFixed(2)}.`); }
    const warn = left <= 0 ? "" : ns === "cancelled" || ns === "refunded" ? `${formatPKR(left)} will be refunded to the customer's wallet. This is final.` : ns === "partial" ? `${formatPKR(r ?? 0)} will be refunded. This is final.` : "";
    if (!confirm(`Change order #${sel.order_no} to "${ns}"?\n${warn}`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("set_order_status", { p_order: sel.id, p_status: ns, p_note: notes || null, p_refund: r });
    setBusy(false); if (error) return setErr(friendlyError(error.message)); setMsg("Status updated."); setNs(""); load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">All Orders</h1>
      <p className="text-sm text-slate-500">Fulfilment is manual: copy the link and quantity, place the order with your provider, then update the status here.</p>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search order #, user, email, service" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[170px]" value={fs} onChange={(e) => setFs(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
        {userId && <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setUserId("")}>Clear customer filter ✕</button>}
      </div>
      <div className="card overflow-x-auto p-0"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500"><tr>{["#", "Customer", "Service", "Qty", "Price", "Status", "Date"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No orders.</td></tr>}
          {list.map((o) => (
            <tr key={o.id} onClick={() => setSelId(o.id)} className={`cursor-pointer border-t hover:bg-slate-50 ${o.id === selId ? "bg-brand-50" : ""}`}>
              <td className="px-4 py-3">{o.order_no}</td><td className="px-4 py-3">{o.profiles?.username}<div className="text-xs text-slate-500">{o.profiles?.email}</div></td>
              <td className="px-4 py-3">{o.service_name}</td><td className="px-4 py-3">{o.quantity}</td><td className="px-4 py-3">{Number(o.total_price) === 0 ? "Lump sum" : formatPKR(o.total_price)}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td><td className="whitespace-nowrap px-4 py-3">{new Date(o.created_at).toLocaleString()}</td>
            </tr>))}
        </tbody></table></div>

      {sel && <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Order #{sel.order_no} <StatusBadge status={sel.status} /></h2>
          <button className="text-sm text-slate-500" onClick={() => setSelId("")}>Close ✕</button></div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><b>Customer:</b> {sel.profiles?.username} ({sel.profiles?.email})</p><p><b>Platform:</b> {sel.platform_name}</p>
          <p><b>Service:</b> {sel.service_name}</p><p><b>Quantity:</b> {sel.quantity}</p>
          <p><b>Price:</b> {Number(sel.total_price) === 0 ? "Lump sum" : formatPKR(sel.total_price)}</p><p><b>Refunded:</b> {formatPKR(sel.refunded_amount)}</p>
          {sel.target_url && <p className="break-all sm:col-span-2"><b>Target link:</b> {sel.target_url}</p>}
          {sel.details && <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 sm:col-span-2"><b>Customer details:</b>{"\n"}{sel.details}</p>}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button className="rounded-lg border px-3 py-1.5" onClick={() => copy(sel.target_url)}>Copy link</button>
          <button className="rounded-lg border px-3 py-1.5" onClick={() => copy(info(sel))}>Copy order info</button>
          <button className="rounded-lg border px-3 py-1.5" onClick={() => { setUserId(sel.user_id); setSelId(""); }}>View customer's orders</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="External provider name (optional)" value={pn} onChange={(e) => setPn(e.target.value)} />
          <input className="input" placeholder="Provider order ID (optional)" value={pid} onChange={(e) => setPid(e.target.value)} />
          <textarea className="input sm:col-span-2" rows={2} placeholder="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn" disabled={busy} onClick={saveDetails}>Save notes & provider</button>
        <div className="border-t pt-3">
          {FINAL.includes(sel.status) ? <p className="text-sm text-slate-500">This order is final ({sel.status}); its status can no longer be changed.</p> : (
            <div className="flex flex-wrap items-center gap-3">
              <select className="input max-w-[180px]" value={ns} onChange={(e) => setNs(e.target.value)}><option value="">Change status…</option>
                {STATUSES.filter((s) => s !== sel.status).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
              {ns === "partial" && <input className="input max-w-[200px]" type="number" step="0.01" placeholder="Refund amount (PKR)" value={refund} onChange={(e) => setRefund(e.target.value)} />}
              <button className="btn" disabled={busy || !ns} onClick={changeStatus}>Update status</button>
              <p className="w-full text-xs text-slate-500">Cancelled / Refunded refund the full unrefunded amount. Partial refunds the amount you enter. These three statuses are final and refund only once.</p>
            </div>)}
        </div>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
      </div>}
    </div>
  );
}
