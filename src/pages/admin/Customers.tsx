import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../auth/AuthProvider";
import { formatPKR } from "../../lib/money";
import { friendlyError } from "../../lib/errors";
import StatusBadge from "../../components/StatusBadge";
type C = { id: string; username: string; email: string; role: string; balance: number; is_blocked: boolean; created_at: string; order_count: number; total_spent: number };
type O = { id: string; order_no: number; service_name: string; quantity: number; total_price: number; status: string; created_at: string };
type T = { id: string; type: string; amount: number; balance_before: number; balance_after: number; description: string; created_at: string };

export default function Customers() {
  const { refreshProfile } = useAuth();
  const [rows, setRows] = useState<C[]>([]); const [q, setQ] = useState(""); const [loadErr, setLoadErr] = useState(""); const [selId, setSelId] = useState("");
  const [orders, setOrders] = useState<O[]>([]); const [tx, setTx] = useState<T[]>([]);
  const [dir, setDir] = useState<"credit" | "debit">("credit"); const [amount, setAmount] = useState(""); const [reason, setReason] = useState(""); const [sure, setSure] = useState(false);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const load = () => supabase.rpc("admin_customer_list").then(({ data, error }) => { if (error) setLoadErr(error.message); else setRows((data ?? []) as C[]); });
  useEffect(() => { load(); }, []);
  const sel = rows.find((r) => r.id === selId);
  const loadDetail = (id: string) => {
    supabase.from("orders").select("id,order_no,service_name,quantity,total_price,status,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setOrders((data ?? []) as O[]));
    supabase.from("wallet_transactions").select("id,type,amount,balance_before,balance_after,description,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setTx((data ?? []) as T[]));
  };
  useEffect(() => { if (selId) { loadDetail(selId); setMsg(""); setErr(""); setAmount(""); setReason(""); setSure(false); } }, [selId]);

  const list = rows.filter((r) => `${r.username} ${r.email} ${r.id}`.toLowerCase().includes(q.toLowerCase()));

  async function adjust() {
    if (!sel) return; setErr(""); setMsg("");
    const amt = parseFloat(amount);
    if (!(amt > 0)) return setErr("Enter an amount above 0.");
    if (reason.trim().length < 3) return setErr("Enter a reason (at least 3 characters).");
    if (!sure) return setErr("Tick the confirmation box.");
    if (dir === "debit" && amt > sel.balance) return setErr(`Debit exceeds the customer's balance (${formatPKR(sel.balance)}).`);
    if (!confirm(`${dir === "credit" ? "Add" : "Remove"} ${formatPKR(amt)} ${dir === "credit" ? "to" : "from"} ${sel.username}'s wallet?\nReason: ${reason.trim()}`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_adjust_balance", { p_user: sel.id, p_direction: dir, p_amount: amt, p_reason: reason.trim() });
    setBusy(false);
    if (error) return setErr(friendlyError(error.message));
    setMsg("Wallet updated."); setAmount(""); setReason(""); setSure(false); load(); loadDetail(sel.id); refreshProfile();
  }
  async function block(blocked: boolean) {
    if (!sel) return; if (!confirm(`${blocked ? "Block" : "Unblock"} ${sel.username}?`)) return;
    setBusy(true); const { error } = await supabase.rpc("set_account_blocked", { p_user: sel.id, p_blocked: blocked }); setBusy(false);
    if (error) return setErr(friendlyError(error.message)); load();
  }
  const plus = (t: string) => ["deposit", "refund", "admin_credit"].includes(t);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Customers</h1>
      {loadErr && <p role="alert" className="card text-red-600">{loadErr}. Run 0005_admin_reports.sql in the Supabase SQL Editor.</p>}
      <input className="input max-w-xs" placeholder="Search username, email or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card overflow-x-auto p-0"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Username", "Email", "Registered", "Balance", "Orders", "Total spent (net)", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">No customers.</td></tr>}
          {list.map((c) => (
            <tr key={c.id} onClick={() => setSelId(c.id)} className={`cursor-pointer border-t hover:bg-slate-50 ${c.id === selId ? "bg-brand-50" : ""}`}>
              <td className="px-4 py-3 text-xs text-slate-500">{c.id.slice(0, 8)}</td><td className="px-4 py-3">{c.username}{c.role === "admin" && <span className="ml-2 rounded bg-violet-100 px-1.5 text-xs text-violet-800">admin</span>}</td>
              <td className="px-4 py-3">{c.email}</td><td className="whitespace-nowrap px-4 py-3">{new Date(c.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">{formatPKR(c.balance)}</td><td className="px-4 py-3">{c.order_count}</td><td className="px-4 py-3">{formatPKR(c.total_spent)}</td>
              <td className="px-4 py-3"><StatusBadge status={c.is_blocked ? "cancelled" : "active"} /> <span className="text-xs">{c.is_blocked ? "blocked" : "active"}</span></td>
            </tr>))}
        </tbody></table></div>

      {sel && <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{sel.username} <span className="text-sm font-normal text-slate-500">{sel.email}</span></h2>
          <button className="text-sm text-slate-500" onClick={() => setSelId("")}>Close ✕</button></div>
        <p className="text-sm">Balance: <b>{formatPKR(sel.balance)}</b></p>

        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="font-medium">Wallet credit / debit</h3>
          <div className="flex flex-wrap gap-3">
            <select className="input max-w-[140px]" value={dir} onChange={(e) => setDir(e.target.value as "credit" | "debit")}><option value="credit">Credit (add)</option><option value="debit">Debit (remove)</option></select>
            <input className="input max-w-[180px]" type="number" min="0" step="0.01" placeholder="Amount (PKR)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className="input min-w-[220px] flex-1" placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} />I confirm this adjustment. It is recorded permanently with my admin identity.</label>
          <button className="btn" disabled={busy} onClick={adjust}>Apply adjustment</button>
        </div>

        <div className="flex gap-3">{sel.is_blocked
          ? <button className="rounded-lg border px-4 py-2 text-sm text-green-700" disabled={busy} onClick={() => block(false)}>Unblock account</button>
          : <button className="rounded-lg border px-4 py-2 text-sm text-red-600" disabled={busy || sel.role === "admin"} onClick={() => block(true)}>Block account</button>}</div>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          <div><h3 className="mb-2 font-medium">Order history</h3>
            {orders.length === 0 ? <p className="text-sm text-slate-500">No orders.</p> : <div className="max-h-72 overflow-auto"><table className="w-full text-left text-sm"><tbody>{orders.map((o) => (
              <tr key={o.id} className="border-t"><td className="py-2 pr-2">#{o.order_no}</td><td className="pr-2">{o.service_name}</td><td className="pr-2">{o.quantity}</td><td className="pr-2">{formatPKR(o.total_price)}</td><td><StatusBadge status={o.status} /></td></tr>))}</tbody></table></div>}</div>
          <div><h3 className="mb-2 font-medium">Wallet history</h3>
            {tx.length === 0 ? <p className="text-sm text-slate-500">No transactions.</p> : <div className="max-h-72 overflow-auto"><table className="w-full text-left text-sm"><tbody>{tx.map((t) => (
              <tr key={t.id} className="border-t"><td className="py-2 pr-2 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td><td className="pr-2">{t.description}</td>
                <td className={`whitespace-nowrap pr-2 font-medium ${plus(t.type) ? "text-green-700" : "text-red-700"}`}>{plus(t.type) ? "+" : "−"}{formatPKR(t.amount)}</td><td className="whitespace-nowrap">{formatPKR(t.balance_after)}</td></tr>))}</tbody></table></div>}</div>
        </div>
      </div>}
    </div>
  );
}
