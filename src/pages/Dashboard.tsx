import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { formatPKR } from "../lib/money";
import { useCountUp } from "../lib/useCountUp";
import StatCard, { Icons } from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import PlatformIcon from "../components/PlatformIcon";
type O = { id: string; order_no: number; service_name: string; platform_name: string; quantity: number; total_price: number; status: string; created_at: string };
type T = { id: string; type: string; amount: number; description: string; created_at: string };
const PLUS = ["deposit", "refund", "admin_credit"];
export default function Dashboard() {
  const { profile } = useAuth();
  const [c, setC] = useState({ total: 0, pending: 0, completed: 0 }); const [orders, setOrders] = useState<O[]>([]); const [tx, setTx] = useState<T[]>([]);
  const balance = useCountUp(Number(profile?.balance ?? 0));
  useEffect(() => {
    if (!profile) return;
    const count = (status?: string) => { let q = supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", profile.id); if (status) q = q.eq("status", status); return q.then((r) => r.count ?? 0); };
    Promise.all([count(), count("pending"), count("completed")]).then(([total, pending, completed]) => setC({ total, pending, completed }));
    supabase.from("orders").select("id,order_no,service_name,platform_name,quantity,total_price,status,created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(5).then(({ data }) => setOrders((data ?? []) as O[]));
    supabase.from("wallet_transactions").select("id,type,amount,description,created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(5).then(({ data }) => setTx((data ?? []) as T[]));
  }, [profile?.id]);
  if (!profile) return <p>Profile not found. Try logging out and in again.</p>;
  return (
    <div className="space-y-6">
      <div className="hero rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm text-white/80">Welcome back</p><h1 className="text-2xl font-bold">{profile.username}</h1>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-wide text-white/70">Wallet balance</p><p className="text-3xl font-bold tabular-nums">{formatPKR(balance)}</p></div>
          <div className="flex gap-2"><Link to="/add-funds" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:-translate-y-0.5 hover:bg-white/90">Add funds</Link>
            <Link to="/new-order" className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-white/10">New order</Link></div>
        </div>
      </div>
      {profile.is_blocked && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Your account is blocked. You cannot place new orders.</p>}
      <div className="stagger grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={c.total} icon={Icons.orders} tone="violet" />
        <StatCard label="Pending orders" value={c.pending} icon={Icons.clock} tone="amber" />
        <StatCard label="Completed orders" value={c.completed} icon={Icons.check} tone="green" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card fade-up space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent orders</h2><Link to="/orders" className="text-sm text-brand-600">View all</Link></div>
          {orders.length === 0 ? <p className="text-sm text-slate-500">No orders yet.</p> : <ul className="divide-y text-sm">{orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2"><span className="flex min-w-0 items-center gap-2"><PlatformIcon name={o.platform_name} size={22} /><span className="truncate">#{o.order_no} {o.service_name}</span></span>
              <span className="flex items-center gap-2 whitespace-nowrap"><span className="text-slate-500">{formatPKR(o.total_price)}</span><StatusBadge status={o.status} /></span></li>))}</ul>}</div>
        <div className="card fade-up space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Recent transactions</h2><Link to="/wallet" className="text-sm text-brand-600">View all</Link></div>
          {tx.length === 0 ? <p className="text-sm text-slate-500">No transactions yet.</p> : <ul className="divide-y text-sm">{tx.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2"><span className="truncate">{t.description}</span>
              <span className={`whitespace-nowrap font-medium ${PLUS.includes(t.type) ? "text-green-600" : "text-rose-600"}`}>{PLUS.includes(t.type) ? "+" : "−"}{formatPKR(t.amount)}</span></li>))}</ul>}</div>
      </div>
    </div>
  );
}
