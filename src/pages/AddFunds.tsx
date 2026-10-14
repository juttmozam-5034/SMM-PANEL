import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { formatPKR } from "../lib/money";
import { friendlyError } from "../lib/errors";
import StatusBadge from "../components/StatusBadge";
type Method = { enabled: boolean; title: string; number: string };
type Cfg = { easypaisa: Method; jazzcash: Method; min_deposit: number; instructions: string };
type Dep = { id: string; method: string; amount: number; trx_id: string; status: string; admin_note: string | null; created_at: string };
const NAMES: Record<string, string> = { easypaisa: "EasyPaisa", jazzcash: "JazzCash" };
const DEP_STATUS: Record<string, string> = { pending: "pending", approved: "completed", rejected: "cancelled" };

export default function AddFunds() {
  const { profile } = useAuth();
  const [cfg, setCfg] = useState<Cfg | null>(null); const [deps, setDeps] = useState<Dep[]>([]);
  const [method, setMethod] = useState<"easypaisa" | "jazzcash" | "">(""); const [amount, setAmount] = useState(""); const [trx, setTrx] = useState("");
  const [error, setError] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState(false);

  const loadDeps = () => { if (profile) supabase.from("deposit_requests").select("id,method,amount,trx_id,status,admin_note,created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(50).then(({ data }) => setDeps((data ?? []) as Dep[])); };
  useEffect(() => { supabase.from("site_settings").select("value").eq("key", "payment").single().then(({ data }) => setCfg((data?.value ?? null) as Cfg | null)); }, []);
  useEffect(() => { loadDeps(); }, [profile?.id]);

  const enabled = (["easypaisa", "jazzcash"] as const).filter((m) => cfg?.[m]?.enabled);
  const m = method ? cfg?.[method] : null;

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setOk("");
    const amt = parseFloat(amount);
    if (!method) return setError("Choose a payment method.");
    if (!(amt > 0)) return setError("Enter the amount you paid.");
    if (cfg && amt < cfg.min_deposit) return setError(`Minimum deposit is ${formatPKR(cfg.min_deposit)}.`);
    if (trx.trim().length < 6) return setError("Enter the transaction ID (TID/TRX ID) from your payment receipt.");
    setBusy(true);
    const { error } = await supabase.rpc("submit_deposit", { p_method: method, p_amount: amt, p_trx: trx.trim() });
    setBusy(false);
    if (error) return setError(friendlyError(error.message));
    setOk("Request submitted. Your wallet will be credited only after an admin verifies the payment."); setAmount(""); setTrx(""); loadDeps();
  }

  if (profile?.is_blocked) return <p className="card text-red-700">Your account is blocked. You cannot submit deposit requests.</p>;
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Add Funds</h1>
      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Deposits are verified <b>manually</b> by an admin. Your wallet is credited only after approval. Never share your payment PIN, OTP or password with anyone, including us.
      </div>
      {!cfg ? <p className="text-slate-500">Loading…</p> : enabled.length === 0 ? <p className="card text-slate-500">No payment method is available right now. Please contact support.</p> : (
        <form onSubmit={submit} className="card space-y-4">
          <div className="flex gap-3">{enabled.map((k) => (
            <button type="button" key={k} onClick={() => setMethod(k)} className={`rounded-lg border px-4 py-2 text-sm ${method === k ? "border-brand-600 bg-brand-50 font-medium" : ""}`}>{NAMES[k]}</button>))}</div>
          {m && <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
            <p>Send payment to this {NAMES[method]} account using your payment app:</p>
            <p><b>Account title:</b> {m.title}</p><p><b>Number:</b> {m.number}</p>
            <p className="text-slate-500">Minimum deposit: {formatPKR(cfg.min_deposit)}</p>
            {cfg.instructions && <p>{cfg.instructions}</p>}
          </div>}
          <input className="input" type="number" min="1" step="0.01" placeholder="Amount paid (PKR)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="input" placeholder="Transaction ID (TID / TRX ID)" value={trx} onChange={(e) => setTrx(e.target.value)} />
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {ok && <p className="text-sm text-green-700">{ok}</p>}
          <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit deposit request"}</button>
        </form>)}
      <div className="space-y-2">
        <h2 className="font-semibold">My deposit requests</h2>
        {deps.length === 0 ? <p className="text-sm text-slate-500">No requests yet.</p> : (
          <div className="card overflow-x-auto p-0"><table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["Date", "Method", "Amount", "TID", "Status", "Admin note"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{deps.map((d) => (
              <tr key={d.id} className="border-t"><td className="whitespace-nowrap px-4 py-3">{new Date(d.created_at).toLocaleString()}</td><td className="px-4 py-3">{NAMES[d.method]}</td>
                <td className="px-4 py-3">{formatPKR(d.amount)}</td><td className="px-4 py-3">{d.trx_id}</td>
                <td className="px-4 py-3"><StatusBadge status={DEP_STATUS[d.status] ?? d.status} /> <span className="text-xs text-slate-500">{d.status}</span></td><td className="px-4 py-3">{d.admin_note ?? ""}</td></tr>))}</tbody>
          </table></div>)}
      </div>
    </div>
  );
}
