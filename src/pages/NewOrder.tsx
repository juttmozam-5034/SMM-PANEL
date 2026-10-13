import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { formatPKR, orderTotal } from "../lib/money";
import { friendlyError } from "../lib/errors";
import type { Category, Platform, Service } from "../lib/types";

export default function NewOrder() {
  const { profile, refreshProfile } = useAuth();
  const nav = useNavigate(); const [sp] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]); const [pl, setPl] = useState<Platform[]>([]); const [cats, setCats] = useState<Category[]>([]);
  const [platformId, setPlatformId] = useState(""); const [categoryId, setCategoryId] = useState(""); const [serviceId, setServiceId] = useState("");
  const [url, setUrl] = useState(""); const [qty, setQty] = useState(""); const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const key = useRef(crypto.randomUUID());   // idempotency key: one per order attempt

  useEffect(() => {
    Promise.all([supabase.from("services").select("*").eq("status", "active").order("service_code"), supabase.from("platforms").select("*"), supabase.from("service_categories").select("*")])
      .then(([s, p, c]) => {
        const list = (s.data ?? []) as Service[]; setServices(list); setPl((p.data ?? []) as Platform[]); setCats((c.data ?? []) as Category[]);
        const pre = list.find((x) => x.id === sp.get("service"));
        if (pre) { setPlatformId(pre.platform_id); setCategoryId(pre.category_id); setServiceId(pre.id); }
      });
  }, []);

  const platforms = useMemo(() => pl.filter((p) => services.some((s) => s.platform_id === p.id)), [pl, services]);
  const categories = useMemo(() => cats.filter((c) => services.some((s) => s.platform_id === platformId && s.category_id === c.id)), [cats, services, platformId]);
  const options = useMemo(() => services.filter((s) => s.platform_id === platformId && s.category_id === categoryId), [services, platformId, categoryId]);
  const svc = services.find((s) => s.id === serviceId);
  const n = parseInt(qty, 10);
  const qtyOk = !!svc && Number.isInteger(n) && n >= svc.min_qty && n <= svc.max_qty;
  const total = svc && qtyOk ? orderTotal(n, Number(svc.price_per_1000)) : 0;
  const urlOk = /^https?:\/\/\S+$/i.test(url.trim());
  const balance = Number(profile?.balance ?? 0);
  const short = qtyOk && total > balance;

  async function place() {
    if (!svc) return; setBusy(true); setError("");
    const { error } = await supabase.rpc("place_order", { p_service: svc.id, p_qty: n, p_url: url.trim(), p_key: key.current, p_expected: total });
    setBusy(false);
    if (error) { setError(friendlyError(error.message)); setConfirm(false); return; }
    key.current = crypto.randomUUID(); await refreshProfile(); nav("/orders");
  }

  if (profile?.is_blocked) return <p className="card text-red-700">Your account is blocked. You cannot place new orders.</p>;
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">New Order</h1>
      <div className="card space-y-4">
        <label className="block text-sm">Platform
          <select className="input mt-1" value={platformId} onChange={(e) => { setPlatformId(e.target.value); setCategoryId(""); setServiceId(""); setConfirm(false); }}>
            <option value="">Select platform</option>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="block text-sm">Category
          <select className="input mt-1" value={categoryId} disabled={!platformId} onChange={(e) => { setCategoryId(e.target.value); setServiceId(""); setConfirm(false); }}>
            <option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="block text-sm">Service
          <select className="input mt-1" value={serviceId} disabled={!categoryId} onChange={(e) => { setServiceId(e.target.value); setConfirm(false); }}>
            <option value="">Select service</option>{options.map((s) => <option key={s.id} value={s.id}>{s.name} — {formatPKR(s.price_per_1000)} / 1000</option>)}</select></label>
        {svc && <div className="rounded-lg bg-brand-50 p-3 text-sm space-y-1">
          <p>{svc.description}</p>
          <p><b>Min:</b> {svc.min_qty} · <b>Max:</b> {svc.max_qty} · <b>Price per 1000:</b> {formatPKR(svc.price_per_1000)} · <b>Delivery:</b> {svc.est_delivery || "—"}</p>
          {svc.instructions && <p><b>Instructions:</b> {svc.instructions}</p>}
        </div>}
        {svc && <>
          <label className="block text-sm">Target link (public video, post or profile)
            <input className="input mt-1" placeholder="https://…" value={url} onChange={(e) => { setUrl(e.target.value); setConfirm(false); }} /></label>
          <label className="block text-sm">Quantity
            <input className="input mt-1" type="number" min={svc.min_qty} max={svc.max_qty} step={1} value={qty} onChange={(e) => { setQty(e.target.value); setConfirm(false); }} /></label>
          {qty !== "" && !qtyOk && <p className="text-sm text-red-600">Quantity must be between {svc.min_qty} and {svc.max_qty}.</p>}
          {qtyOk && <p className="text-lg font-semibold">Total: {formatPKR(total)}</p>}
          {short && <p className="text-sm text-red-600">Insufficient balance ({formatPKR(balance)}). <Link to="/add-funds" className="underline">Add Funds</Link></p>}
        </>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {svc && !confirm && <button className="btn" disabled={!qtyOk || !urlOk || short} onClick={() => setConfirm(true)}>Review order</button>}
        {svc && confirm && <div className="rounded-lg border p-4 text-sm space-y-2">
          <p><b>{svc.name}</b></p><p className="break-all">Link: {url.trim()}</p><p>Quantity: {n}</p><p>Total: <b>{formatPKR(total)}</b> will be deducted from your wallet.</p>
          <p className="text-slate-500">Orders are fulfilled manually by the admin. Status updates appear in My Orders.</p>
          <div className="flex gap-2"><button className="btn" disabled={busy} onClick={place}>{busy ? "Placing…" : "Confirm order"}</button>
            <button className="rounded-lg border px-4 py-2 text-sm" disabled={busy} onClick={() => setConfirm(false)}>Edit</button></div>
        </div>}
      </div>
    </div>
  );
}
