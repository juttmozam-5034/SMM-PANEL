import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPKR } from "../../lib/money";
import StatCard, { Icons } from "../../components/StatCard";
type S = Record<string, number>;
export default function AdminDashboard() {
  const [s, setS] = useState<S | null>(null); const [err, setErr] = useState("");
  useEffect(() => { supabase.rpc("admin_dashboard_stats").then(({ data, error }) => { if (error) setErr(error.message); else setS(data as S); }); }, []);
  if (err) return <p role="alert" className="card text-red-600">{err}. Run 0005_admin_reports.sql in the Supabase SQL Editor.</p>;
  if (!s) return <p className="text-slate-500">Loading…</p>;
  const money = (n: number) => formatPKR(n);
  return (
    <div className="space-y-6">
      <div className="hero rounded-2xl p-6 text-white shadow-lg"><h1 className="text-2xl font-bold">Admin Dashboard</h1><p className="text-sm text-white/80">Orders, deposits and wallet totals at a glance.</p></div>
      <section className="space-y-3"><h2 className="font-medium text-slate-600">Customers & orders</h2>
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total customers" value={s.customers} icon={Icons.users} tone="violet" />
          <StatCard label="Total orders" value={s.orders} icon={Icons.orders} tone="blue" />
          <StatCard label="Pending orders" value={s.pending} icon={Icons.clock} tone="amber" />
          <StatCard label="In-progress orders" value={s.in_progress} icon={Icons.clock} tone="blue" />
          <StatCard label="Completed orders" value={s.completed} icon={Icons.check} tone="green" />
          <StatCard label="Cancelled orders" value={s.cancelled} icon={Icons.cross} tone="rose" />
          <StatCard label="Pending deposit requests" value={s.pending_deposits} icon={Icons.inbox} tone="amber" /></div></section>
      <section className="space-y-3"><h2 className="font-medium text-slate-600">Money (kept separate on purpose)</h2>
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Gross order revenue" value={s.gross_revenue} format={money} icon={Icons.coin} tone="green" note="All order payments received" />
          <StatCard label="Refunds" value={s.total_refunds} format={money} icon={Icons.refund} tone="rose" note="Returned to customer wallets" />
          <StatCard label="Net order revenue" value={s.gross_revenue - s.total_refunds} format={money} icon={Icons.coin} tone="violet" note="Gross minus refunds, before provider costs" />
          <StatCard label="Total deposits" value={s.total_deposits} format={money} icon={Icons.wallet} tone="blue" note="Approved deposits. Not profit." />
          <StatCard label="Customer wallet balances" value={s.wallet_liabilities} format={money} icon={Icons.wallet} tone="slate" note="Liability: money customers can still spend. Not profit." /></div></section>
    </div>
  );
}
