import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatPKR } from "../lib/money";
import type { Category, Platform, Service } from "../lib/types";
export default function Services() {
  const [rows, setRows] = useState<Service[]>([]); const [pl, setPl] = useState<Platform[]>([]); const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState(""); const [fp, setFp] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([supabase.from("services").select("*").eq("status", "active").order("service_code"), supabase.from("platforms").select("*"), supabase.from("service_categories").select("*")])
      .then(([s, p, c]) => { setRows((s.data ?? []) as Service[]); setPl((p.data ?? []) as Platform[]); setCats((c.data ?? []) as Category[]); setLoading(false); });
  }, []);
  const pn = (id: string) => pl.find((x) => x.id === id)?.name ?? "";
  const cn = (id: string) => cats.find((x) => x.id === id)?.name ?? "";
  const list = useMemo(() => rows.filter((s) => (!fp || s.platform_id === fp) && s.name.toLowerCase().includes(q.toLowerCase())), [rows, q, fp]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Services</h1>
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search services" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-xs" value={fp} onChange={(e) => setFp(e.target.value)}>
          <option value="">All platforms</option>{pl.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {loading ? <p className="text-slate-500">Loading…</p> : list.length === 0 ? <p className="card text-slate-500">No active services available yet.</p> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Service", "Platform", "Category", "Min", "Max", "Per 1000", "Delivery", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{list.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">{s.service_code}</td><td className="px-4 py-3">{s.name}</td><td className="px-4 py-3">{pn(s.platform_id)}</td><td className="px-4 py-3">{cn(s.category_id)}</td>
                <td className="px-4 py-3">{s.min_qty}</td><td className="px-4 py-3">{s.max_qty}</td><td className="px-4 py-3">{formatPKR(s.price_per_1000)}</td><td className="px-4 py-3">{s.est_delivery}</td>
                <td className="px-4 py-3"><Link className="text-brand-600" to={`/new-order?service=${s.id}`}>Order</Link></td>
              </tr>))}</tbody>
          </table>
        </div>)}
    </div>
  );
}
