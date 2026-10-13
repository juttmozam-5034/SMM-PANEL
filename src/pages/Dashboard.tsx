import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { formatPKR } from "../lib/money";
export default function Dashboard() {
  const { profile } = useAuth();
  const [c, setC] = useState({ total: 0, pending: 0, completed: 0 });
  useEffect(() => {
    if (!profile) return;
    const count = (status?: string) => {
      let q = supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", profile.id);
      if (status) q = q.eq("status", status);
      return q.then((r) => r.count ?? 0);
    };
    Promise.all([count(), count("pending"), count("completed")]).then(([total, pending, completed]) => setC({ total, pending, completed }));
  }, [profile?.id]);
  if (!profile) return <p>Profile not found. Try logging out and in again.</p>;
  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="card"><div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></div>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Welcome, {profile.username}</h1>
      {profile.is_blocked && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Your account is blocked. You cannot place new orders.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Wallet balance" value={formatPKR(profile.balance)} />
        <Stat label="Total orders" value={c.total} />
        <Stat label="Pending orders" value={c.pending} />
        <Stat label="Completed orders" value={c.completed} />
      </div>
      <Link to="/new-order" className="btn">Place a new order</Link>
    </div>
  );
}
