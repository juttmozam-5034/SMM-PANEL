import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { useSite } from "../lib/site";
import { formatPKR, orderTotal } from "../lib/money";
import { friendlyError } from "../lib/errors";
import { linkInfo } from "../lib/linkType";
import PlatformIcon from "../components/PlatformIcon";
import Toast from "../components/Toast";
import type { Category, Platform, Service } from "../lib/types";

export default function NewOrder() {
  const { profile, refreshProfile } = useAuth(); const { site } = useSite();
  const nav = useNavigate(); const [sp] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]); const [pl, setPl] = useState<Platform[]>([]); const [cats, setCats] = useState<Category[]>([]);
  const [platformId, setPlatformId] = useState(""); const [categoryId, setCategoryId] = useState(""); const [serviceId, setServiceId] = useState("");
  const [url, setUrl] = useState(""); const [qty, setQty] = useState(""); const [details, setDetails] = useState(""); const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [toast, setToast] = useState<{ message: string; href?: string } | null>(null);
  const [sent, setSent] = useState(false);
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
  // when there is only one choice, select it automatically
  useEffect(() => { if (platformId && !categoryId && categories.length === 1) setCategoryId(categories[0].id); }, [platformId, categoryId, categories]);
  useEffect(() => { if (categoryId && !serviceId && options.length === 1) setServiceId(options[0].id); }, [categoryId, serviceId, options]);

  const svc = services.find((s) => s.id === serviceId);
  const kind = svc?.kind ?? "order";
  const isRequest = kind === "request"; const isFixed = kind === "fixed"; const isOrder = !!svc && kind === "order";
  const li = svc ? linkInfo(cats.find((c) => c.id === categoryId)?.name ?? "", svc.name) : null;
  const n = parseInt(qty, 10);
  const qtyOk = isOrder && !!svc && Number.isInteger(n) && n >= svc.min_qty && n <= svc.max_qty;
  const fixedPrice = isFixed && svc ? Math.round(Number(svc.price_per_1000) * 100) / 100 : 0;
  const total = isFixed ? fixedPrice : svc && qtyOk ? orderTotal(n, Number(svc.price_per_1000)) : 0;
  const urlOk = /^https?:\/\/\S+$/i.test(url.trim());
  const balance = Number(profile?.balance ?? 0);
  const short = (isOrder ? qtyOk : isFixed) && total > balance;
  const reset = () => { setConfirm(false); setError(""); setSent(false); };
  const priceLabel = (s: Service) => (s.kind === "request" ? "Lump sum" : s.kind === "fixed" ? formatPKR(s.price_per_1000) : `${formatPKR(s.price_per_1000)} / 1000`);

  async function place() {
    if (!svc) return; setBusy(true); setError("");
    const { error } = isFixed
      ? await supabase.rpc("place_fixed_order", { p_service: svc.id, p_details: details.trim() || null, p_key: key.current, p_expected: fixedPrice })
      : await supabase.rpc("place_order", { p_service: svc.id, p_qty: n, p_url: url.trim(), p_key: key.current, p_expected: total });
    setBusy(false);
    if (error) { setError(friendlyError(error.message)); setConfirm(false); return; }
    key.current = crypto.randomUUID(); await refreshProfile(); nav("/orders");
  }
  async function sendRequest() {
    if (!svc) return; setError("");
    if (details.trim().length < 10) return setError("Please add a few details about what you need (at least 10 characters).");
    setBusy(true);
    const { error } = await supabase.rpc("place_custom_order", { p_service: svc.id, p_details: details.trim(), p_key: key.current });
    setBusy(false);
    if (error) return setError(friendlyError(error.message));
    key.current = crypto.randomUUID(); setDetails(""); setSent(true);
    const wa = site.whatsapp_number ? `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(`Hello ${site.name}, I just sent a request for "${svc.name}". Please contact me.`)}` : undefined;
    setToast({ message: "Request sent! Kindly contact us now on WhatsApp also.", href: wa });
  }

  if (profile?.is_blocked) return <p className="card text-red-700">Your account is blocked. You cannot place new orders.</p>;
  return (
    <div className="max-w-2xl space-y-4">
      {toast && <Toast message={toast.message} action={toast.href ? { label: "Chat on WhatsApp", href: toast.href } : undefined} onClose={() => setToast(null)} />}
      <h1 className="text-xl font-semibold">New Order</h1>
      <div className="card space-y-4">
        <div><div className="mb-1 text-sm">Platform</div><div className="flex flex-wrap gap-2">{platforms.map((p) => (
          <button type="button" key={p.id} onClick={() => { setPlatformId(p.id); setCategoryId(""); setServiceId(""); reset(); }}
            className={`hover-lift flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${platformId === p.id ? "border-brand-600 bg-brand-50 font-medium ring-2 ring-brand-500/30" : "bg-white"}`}><PlatformIcon name={p.name} size={22} />{p.name}</button>))}</div></div>
        <label className="block text-sm">Category
          <select className="input mt-1" value={categoryId} disabled={!platformId} onChange={(e) => { setCategoryId(e.target.value); setServiceId(""); reset(); }}>
            <option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="block text-sm">Service
          <select className="input mt-1" value={serviceId} disabled={!categoryId} onChange={(e) => { setServiceId(e.target.value); reset(); }}>
            <option value="">Select service</option>{options.map((s) => <option key={s.id} value={s.id}>{s.name} — {priceLabel(s)}</option>)}</select></label>

        {svc && <div className="space-y-1 rounded-lg bg-brand-50 p-3 text-sm">
          <p>{svc.description}</p>
          {isOrder ? <p><b>Min:</b> {svc.min_qty} · <b>Max:</b> {svc.max_qty} · <b>Price per 1000:</b> {formatPKR(svc.price_per_1000)} · <b>Delivery:</b> {svc.est_delivery || "—"}</p>
            : <p><b>Price:</b> {isRequest ? "Lump sum" : formatPKR(svc.price_per_1000)}{svc.est_delivery && <> · <b>Delivery:</b> {svc.est_delivery}</>}</p>}
          {svc.instructions && <p><b>Instructions:</b> {svc.instructions}</p>}
        </div>}

        {/* request services: description only, no payment, order starts as Pending */}
        {svc && isRequest && <>
          <label className="block text-sm">Add details about your website: which type you need, pages, features, examples you like
            <textarea className="input mt-1" rows={6} maxLength={3000} placeholder="Example: I need an e-commerce website for my clothing brand with 20 products, online payment and a contact page…" value={details} onChange={(e) => { setDetails(e.target.value); setError(""); setSent(false); }} /></label>
          <p className="text-xs text-slate-500">This does not use your wallet balance. Your order is created as Pending and we will contact you.</p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {sent && <p className="text-sm text-green-700">Your order is now Pending. <Link to="/orders" className="underline">View My Orders</Link></p>}
          <button className="btn" disabled={busy || details.trim().length < 10} onClick={sendRequest}>{busy ? "Sending…" : "Send"}</button>
        </>}

        {/* fixed-price services: no link, no quantity, wallet is charged */}
        {svc && isFixed && <>
          <label className="block text-sm">Any details for us (optional)
            <textarea className="input mt-1" rows={3} maxLength={3000} placeholder="Example: preferred panel name, domain, notes…" value={details} onChange={(e) => { setDetails(e.target.value); setConfirm(false); }} /></label>
          <p className="text-lg font-semibold">Total: {formatPKR(fixedPrice)}</p>
          {short && <p className="text-sm text-red-600">Insufficient balance ({formatPKR(balance)}). <Link to="/add-funds" className="underline">Add Funds</Link></p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {!confirm && <button className="btn" disabled={short || fixedPrice <= 0} onClick={() => setConfirm(true)}>Review order</button>}
          {confirm && <div className="space-y-2 rounded-lg border p-4 text-sm">
            <p><b>{svc.name}</b></p><p>Total: <b>{formatPKR(fixedPrice)}</b> will be deducted from your wallet.</p>
            <p className="text-slate-500">Your order is created as Pending and we will contact you.</p>
            <div className="flex gap-2"><button className="btn" disabled={busy} onClick={place}>{busy ? "Placing…" : "Confirm order"}</button>
              <button className="rounded-lg border px-4 py-2 text-sm" disabled={busy} onClick={() => setConfirm(false)}>Edit</button></div>
          </div>}
        </>}

        {/* normal services: link + quantity */}
        {svc && isOrder && <>
          <label className="block text-sm">{li?.label ?? "Paste your link"}
            <input className="input mt-1" placeholder={li?.placeholder ?? "https://…"} value={url} onChange={(e) => { setUrl(e.target.value); setConfirm(false); }} />
            <span className="mt-1 block text-xs text-slate-500">{li?.hint}</span></label>
          <label className="block text-sm">Quantity
            <input className="input mt-1" type="number" min={svc.min_qty} max={svc.max_qty} step={1} value={qty} onChange={(e) => { setQty(e.target.value); setConfirm(false); }} /></label>
          {qty !== "" && !qtyOk && <p className="text-sm text-red-600">Quantity must be between {svc.min_qty} and {svc.max_qty}.</p>}
          {qtyOk && <p className="text-lg font-semibold">Total: {formatPKR(total)}</p>}
          {short && <p className="text-sm text-red-600">Insufficient balance ({formatPKR(balance)}). <Link to="/add-funds" className="underline">Add Funds</Link></p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {!confirm && <button className="btn" disabled={!qtyOk || !urlOk || short} onClick={() => setConfirm(true)}>Review order</button>}
          {confirm && <div className="space-y-2 rounded-lg border p-4 text-sm">
            <p><b>{svc.name}</b></p><p className="break-all">Link: {url.trim()}</p><p>Quantity: {n}</p><p>Total: <b>{formatPKR(total)}</b> will be deducted from your wallet.</p>
            <p className="text-slate-500">Orders are fulfilled manually by the admin. Status updates appear in My Orders.</p>
            <div className="flex gap-2"><button className="btn" disabled={busy} onClick={place}>{busy ? "Placing…" : "Confirm order"}</button>
              <button className="rounded-lg border px-4 py-2 text-sm" disabled={busy} onClick={() => setConfirm(false)}>Edit</button></div>
          </div>}
        </>}
        {!svc && error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
