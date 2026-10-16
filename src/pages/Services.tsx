import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatPKR } from "../lib/money";
import PlatformIcon from "../components/PlatformIcon";
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
        <select className="input max-w-xs" value={fp} onChange={(e) => setFp(e.target.value)}><option value="">All platforms</option>{pl.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      {loading ? <p className="text-slate-500">Loading…</p> : list.length === 0 ? <p className="card text-slate-500">No active services available yet.</p> : (
        <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((s) => (
          <div key={s.id} className="hover-lift flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3"><PlatformIcon name={pn(s.platform_id)} size={40} />
              <div className="min-w-0"><div className="font-medium leading-snug">{s.name}</div><div className="text-xs text-slate-500">#{s.service_code} · {pn(s.platform_id)} · {cn(s.category_id)}</div></div></div>
            <div className="mt-4 text-2xl font-semibold text-brand-600">{s.kind === "request" ? "Lump sum" : <>{formatPKR(s.price_per_1000)}{s.kind === "order" && <span className="text-sm font-normal text-slate-500"> / 1000</span>}</>}</div>
            {s.kind !== "order" ? <p className="mt-3 text-sm text-slate-600">{s.description}</p> : <dl className="mt-3 grid grid-cols-2 gap-1 text-sm text-slate-600"><dt>Min</dt><dd className="text-right">{s.min_qty}</dd><dt>Max</dt><dd className="text-right">{s.max_qty}</dd><dt>Delivery</dt><dd className="text-right">{s.est_delivery || "—"}</dd></dl>}
            <Link to={`/new-order?service=${s.id}`} className="btn mt-4">{s.kind === "request" ? "Request now" : s.kind === "fixed" ? "Buy now" : "Order now"}</Link>
          </div>))}</div>)}
    </div>
  );
}
