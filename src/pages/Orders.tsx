import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { formatPKR } from "../lib/money";
import StatusBadge from "../components/StatusBadge";
import type { Order } from "../lib/types";
export default function Orders() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Order[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile) return;
    supabase.from("orders").select("id,order_no,service_name,platform_name,target_url,quantity,total_price,status,created_at")
      .eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setRows((data ?? []) as Order[]); setLoading(false); });
  }, [profile?.id]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Orders</h1>
      {loading ? <p className="text-slate-500">Loading…</p> : rows.length === 0 ? <p className="card text-slate-500">No orders yet.</p> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["#", "Service", "Link", "Qty", "Total", "Status", "Date"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3">{o.order_no}</td><td className="px-4 py-3">{o.service_name}</td>
                <td className="max-w-[200px] truncate px-4 py-3">{o.target_url}</td><td className="px-4 py-3">{o.quantity}</td>
                <td className="px-4 py-3">{formatPKR(o.total_price)}</td><td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3">{new Date(o.created_at).toLocaleString()}</td>
              </tr>))}</tbody>
          </table>
        </div>)}
    </div>
  );
}
