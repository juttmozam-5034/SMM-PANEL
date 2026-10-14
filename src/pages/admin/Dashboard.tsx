import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPKR } from "../../lib/money";
type S = Record<string, number>;
export default function AdminDashboard() {
  const [s, setS] = useState<S | null>(null); const [err, setErr] = useState("");
  useEffect(() => { supabase.rpc("admin_dashboard_stats").then(({ data, error }) => { if (error) setErr(error.message); else setS(data as S); }); }, []);
  if (err) return <p role="alert" className="card text-red-600">{err}. Run 0005_admin_reports.sql in the Supabase SQL Editor.</p>;
  if (!s) return <p className="text-slate-500">Loading…</p>;
  const Card = ({ label, value, note }: { label: string; value: string | number; note?: string }) => (
    <div className="card"><div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div>{note && <div className="mt-1 text-xs text-slate-400">{note}</div>}</div>);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <section className="space-y-3"><h2 className="font-medium text-slate-600">Customers & orders</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Total customers" value={s.customers} /><Card label="Total orders" value={s.orders} />
          <Card label="Pending orders" value={s.pending} /><Card label="In-progress orders" value={s.in_progress} />
          <Card label="Completed orders" value={s.completed} /><Card label="Cancelled orders" value={s.cancelled} />
          <Card label="Pending deposit requests" value={s.pending_deposits} /></div></section>
      <section className="space-y-3"><h2 className="font-medium text-slate-600">Money (kept separate on purpose)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Gross order revenue" value={formatPKR(s.gross_revenue)} note="All order payments received" />
          <Card label="Refunds" value={formatPKR(s.total_refunds)} note="Returned to customer wallets" />
          <Card label="Net order revenue" value={formatPKR(s.gross_revenue - s.total_refunds)} note="Gross revenue minus refunds, before provider costs" />
          <Card label="Total deposits" value={formatPKR(s.total_deposits)} note="Approved deposits. Not profit." />
          <Card label="Customer wallet balances" value={formatPKR(s.wallet_liabilities)} note="Liability: money customers can still spend. Not profit." /></div></section>
    </div>
  );
}
