import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { formatPKR } from "../lib/money";
type Tx = { id: string; type: string; amount: number; balance_before: number; balance_after: number; description: string; created_at: string };
const LABEL: Record<string, string> = { deposit: "Deposit", order_payment: "Order payment", refund: "Refund", admin_credit: "Admin credit", admin_debit: "Admin debit" };
export default function Wallet() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Tx[]>([]); const [loading, setLoading] = useState(true); const [f, setF] = useState("");
  useEffect(() => {
    if (!profile) return;
    supabase.from("wallet_transactions").select("id,type,amount,balance_before,balance_after,description,created_at")
      .eq("user_id", profile.id).order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { setRows((data ?? []) as Tx[]); setLoading(false); });
  }, [profile?.id]);
  const list = rows.filter((r) => !f || r.type === f);
  const plus = (t: string) => ["deposit", "refund", "admin_credit"].includes(t);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Wallet History</h1>
        <div className="text-sm">Current balance: <b>{formatPKR(profile?.balance ?? 0)}</b></div>
      </div>
      <select className="input max-w-xs" value={f} onChange={(e) => setF(e.target.value)}>
        <option value="">All transactions</option>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {loading ? <p className="text-slate-500">Loading…</p> : list.length === 0 ? <p className="card text-slate-500">No transactions yet.</p> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["Date", "Type", "Description", "Amount", "Before", "After"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="whitespace-nowrap px-4 py-3">{new Date(r.created_at).toLocaleString()}</td><td className="px-4 py-3">{LABEL[r.type] ?? r.type}</td>
                <td className="px-4 py-3">{r.description}</td>
                <td className={`whitespace-nowrap px-4 py-3 font-medium ${plus(r.type) ? "text-green-700" : "text-red-700"}`}>{plus(r.type) ? "+" : "−"}{formatPKR(r.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatPKR(r.balance_before)}</td><td className="whitespace-nowrap px-4 py-3">{formatPKR(r.balance_after)}</td>
              </tr>))}</tbody>
          </table>
        </div>)}
    </div>
  );
}
