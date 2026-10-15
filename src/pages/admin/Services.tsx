import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatPKR } from "../../lib/money";
import StatusBadge from "../../components/StatusBadge";
import PlatformIcon from "../../components/PlatformIcon";
import type { Category, Platform, Service } from "../../lib/types";

type Form = { id?: string; name: string; platform_id: string; category_id: string; description: string; min_qty: string; max_qty: string; price_per_1000: string; est_delivery: string; instructions: string; status: Service["status"] };
const empty: Form = { name: "", platform_id: "", category_id: "", description: "", min_qty: "100", max_qty: "10000", price_per_1000: "", est_delivery: "", instructions: "", status: "inactive" };
const PAGE = 10;

export default function AdminServices() {
  const [rows, setRows] = useState<Service[]>([]); const [pl, setPl] = useState<Platform[]>([]); const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState(""); const [fp, setFp] = useState(""); const [fc, setFc] = useState(""); const [fs, setFs] = useState(""); const [sort, setSort] = useState("code");
  const [page, setPage] = useState(1); const [f, setF] = useState<Form | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const load = async () => {
    const [s, p, c] = await Promise.all([supabase.from("services").select("*"), supabase.from("platforms").select("*").order("name"), supabase.from("service_categories").select("*").order("name")]);
    setRows((s.data ?? []) as Service[]); setPl((p.data ?? []) as Platform[]); setCats((c.data ?? []) as Category[]);
  };
  useEffect(() => { load(); }, []);
  const pn = (id: string) => pl.find((x) => x.id === id)?.name ?? "—";
  const cn = (id: string) => cats.find((x) => x.id === id)?.name ?? "—";

  const list = useMemo(() => {
    const r = rows.filter((s) => (!fp || s.platform_id === fp) && (!fc || s.category_id === fc) && (!fs || s.status === fs) &&
      (s.name.toLowerCase().includes(q.toLowerCase()) || String(s.service_code) === q.trim()));
    const by: Record<string, (a: Service, b: Service) => number> = {
      code: (a, b) => a.service_code - b.service_code, name: (a, b) => a.name.localeCompare(b.name),
      price_asc: (a, b) => a.price_per_1000 - b.price_per_1000, price_desc: (a, b) => b.price_per_1000 - a.price_per_1000 };
    return [...r].sort(by[sort]);
  }, [rows, q, fp, fc, fs, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const view = list.slice((page - 1) * PAGE, page * PAGE);
  useEffect(() => { setPage(1); }, [q, fp, fc, fs, sort]);

  async function save() {
    if (!f) return; setErr("");
    const min = parseInt(f.min_qty, 10), max = parseInt(f.max_qty, 10), price = parseFloat(f.price_per_1000);
    if (f.name.trim().length < 3) return setErr("Service name is required (min 3 characters).");
    if (!f.platform_id || !f.category_id) return setErr("Choose a platform and a category.");
    if (!(min > 0) || !(max >= min)) return setErr("Minimum must be above 0 and maximum must be at least the minimum.");
    if (!(price >= 0)) return setErr("Enter a valid price per 1000 in PKR.");
    const payload = { name: f.name.trim(), platform_id: f.platform_id, category_id: f.category_id, description: f.description.trim(), min_qty: min, max_qty: max,
      price_per_1000: price, est_delivery: f.est_delivery.trim(), instructions: f.instructions.trim(), status: f.status, is_sample: false };
    setBusy(true);
    const { error } = f.id ? await supabase.from("services").update(payload).eq("id", f.id) : await supabase.from("services").insert(payload);
    setBusy(false);
    if (error) return setErr(error.message);
    setF(null); load();
  }
  async function setStatus(s: Service, status: Service["status"]) {
    if (status === "archived" && !confirm(`Archive "${s.name}"? Customers will no longer see it.`)) return;
    await supabase.from("services").update({ status }).eq("id", s.id); load();
  }
  const edit = (s: Service) => setF({ id: s.id, name: s.name, platform_id: s.platform_id, category_id: s.category_id, description: s.description, min_qty: String(s.min_qty),
    max_qty: String(s.max_qty), price_per_1000: String(s.price_per_1000), est_delivery: s.est_delivery, instructions: s.instructions, status: s.status });
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((x) => (x ? { ...x, [k]: e.target.value } : x));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Manage Services</h1><button className="btn" onClick={() => { setErr(""); setF(empty); }}>Add service</button></div>

      {f && <div className="card space-y-3">
        <h2 className="font-semibold">{f.id ? "Edit service" : "New service"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input sm:col-span-2" placeholder="Service name" value={f.name} onChange={set("name")} />
          <select className="input" value={f.platform_id} onChange={set("platform_id")}><option value="">Platform</option>{pl.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className="input" value={f.category_id} onChange={set("category_id")}><option value="">Category</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input className="input" type="number" placeholder="Min quantity" value={f.min_qty} onChange={set("min_qty")} />
          <input className="input" type="number" placeholder="Max quantity" value={f.max_qty} onChange={set("max_qty")} />
          <input className="input" type="number" step="0.01" placeholder="Price per 1000 (PKR)" value={f.price_per_1000} onChange={set("price_per_1000")} />
          <input className="input" placeholder="Estimated delivery (e.g. 0-24 hours)" value={f.est_delivery} onChange={set("est_delivery")} />
          <textarea className="input sm:col-span-2" rows={2} placeholder="Description" value={f.description} onChange={set("description")} />
          <textarea className="input sm:col-span-2" rows={2} placeholder="Customer instructions" value={f.instructions} onChange={set("instructions")} />
          <select className="input" value={f.status} onChange={set("status")}><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select>
        </div>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <div className="flex gap-2"><button className="btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button><button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setF(null)}>Cancel</button></div>
      </div>}

      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[160px]" value={fp} onChange={(e) => setFp(e.target.value)}><option value="">All platforms</option>{pl.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className="input max-w-[160px]" value={fc} onChange={(e) => setFc(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="input max-w-[140px]" value={fs} onChange={(e) => setFs(e.target.value)}><option value="">All status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select>
        <select className="input max-w-[170px]" value={sort} onChange={(e) => setSort(e.target.value)}><option value="code">Sort: ID</option><option value="name">Sort: Name</option><option value="price_asc">Price low–high</option><option value="price_desc">Price high–low</option></select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Service", "Platform", "Category", "Min/Max", "Per 1000", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {view.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">No services found.</td></tr>}
            {view.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">{s.service_code}</td>
                <td className="px-4 py-3">{s.name}{s.is_sample && <span className="ml-2 rounded bg-yellow-100 px-1.5 text-xs text-yellow-800">sample</span>}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-2"><PlatformIcon name={pn(s.platform_id)} size={20} />{pn(s.platform_id)}</span></td><td className="px-4 py-3">{cn(s.category_id)}</td>
                <td className="px-4 py-3">{s.min_qty}/{s.max_qty}</td><td className="px-4 py-3">{formatPKR(s.price_per_1000)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="space-x-3 whitespace-nowrap px-4 py-3">
                  <button className="text-brand-600" onClick={() => edit(s)}>Edit</button>
                  {s.status !== "active" && s.status !== "archived" && <button className="text-green-700" onClick={() => setStatus(s, "active")}>Activate</button>}
                  {s.status === "active" && <button className="text-slate-600" onClick={() => setStatus(s, "inactive")}>Deactivate</button>}
                  {s.status !== "archived" && <button className="text-red-600" onClick={() => setStatus(s, "archived")}>Archive</button>}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{list.length} services</span>
        <span className="flex items-center gap-2"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>Page {page} / {pages}
          <button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></span>
      </div>
    </div>
  );
}
