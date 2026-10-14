import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { useSite } from "../lib/site";
import { formatPKR } from "../lib/money";
import ChatWidget from "../components/ChatWidget";
type S = { id: string; name: string; platform_id: string; price_per_1000: number };
type P = { id: string; name: string };
export default function Landing() {
  const { site } = useSite(); const { session } = useAuth();
  const [services, setServices] = useState<S[]>([]); const [pl, setPl] = useState<P[]>([]);
  useEffect(() => { Promise.all([supabase.from("services").select("id,name,platform_id,price_per_1000").eq("status", "active").order("service_code").limit(60), supabase.from("platforms").select("id,name")])
    .then(([s, p]) => { setServices((s.data ?? []) as S[]); setPl((p.data ?? []) as P[]); }); }, []);
  const groups = pl.map((p) => ({ p, items: services.filter((s) => s.platform_id === p.id) })).filter((g) => g.items.length > 0);
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-navy-900 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <span className="flex items-center gap-2 text-lg font-semibold">{site.logo_url && <img src={site.logo_url} alt="" className="h-7 w-7 rounded" />}{site.name}</span>
        <nav className="flex gap-3 text-sm">{session ? <Link className="btn" to="/dashboard">Dashboard</Link> : <><Link className="rounded-lg px-3 py-2 hover:bg-navy-700" to="/login">Log in</Link><Link className="btn" to="/register">Register</Link></>}</nav></div>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-14"><h1 className="max-w-2xl text-4xl font-bold leading-tight">Social media marketing services, managed from one wallet.</h1>
          <p className="mt-4 max-w-xl text-slate-300">Add funds, choose a service, place your order and track its status. Orders are processed manually by our team.</p>
          <div className="mt-8 flex gap-3"><Link className="btn" to={session ? "/new-order" : "/register"}>{session ? "Place an order" : "Create free account"}</Link>{!session && <Link className="rounded-lg border border-navy-700 px-4 py-2 text-sm hover:bg-navy-700" to="/login">Log in</Link>}</div></div></header>

      <section className="mx-auto max-w-6xl px-4 py-14"><h2 className="text-2xl font-semibold">Services</h2>
        {groups.length === 0 ? <p className="mt-4 text-slate-500">Services will be listed here soon.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{groups.map(({ p, items }) => (
          <div key={p.id} className="card"><h3 className="font-semibold">{p.name}</h3><ul className="mt-3 space-y-1 text-sm text-slate-600">{items.slice(0, 4).map((s) => <li key={s.id} className="flex justify-between gap-2"><span>{s.name}</span><span className="whitespace-nowrap">{formatPKR(s.price_per_1000)} / 1000</span></li>)}</ul></div>))}</div>}</section>

      <section className="bg-slate-50 py-14"><div className="mx-auto max-w-6xl px-4"><h2 className="text-2xl font-semibold">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">{[["1. Register", "Create your free account."], ["2. Add funds", "Pay by EasyPaisa or JazzCash. An admin verifies your payment manually, then your wallet is credited."], ["3. Place an order", "Pick a service, paste your link and choose a quantity."], ["4. Track status", "Follow your order from pending to completed in your account."]].map(([t, d]) => (
          <div key={t} className="card"><h3 className="font-medium">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>))}</div></div></section>

      <section className="mx-auto max-w-6xl px-4 py-14"><h2 className="text-2xl font-semibold">Why use us</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{[["Clear pricing", "Price per 1000 in PKR. The total is shown before you confirm."], ["Private wallet", "Every account has its own wallet with a full transaction history."], ["Human support", "Open a ticket and our team replies inside your account."]].map(([t, d]) => (
          <div key={t} className="card"><h3 className="font-medium">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>))}</div></section>

      <ChatWidget />
      <footer className="bg-navy-900 py-8 text-sm text-slate-300"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <span className="flex flex-wrap gap-4">{site.support_contact && <span>Support: {site.support_contact}</span>}{site.footer_links.map((l) => <a key={l.url + l.label} href={l.url} className="underline">{l.label}</a>)}</span></div></footer>
    </div>
  );
}
