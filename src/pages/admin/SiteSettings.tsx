import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useSite } from "../../lib/site";
export default function SiteSettings() {
  const { site, reload } = useSite();
  const [name, setName] = useState(""); const [logo, setLogo] = useState(""); const [support, setSupport] = useState(""); const [wa, setWa] = useState(""); const [links, setLinks] = useState(""); const [logos, setLogos] = useState(true);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { setName(site.name); setLogo(site.logo_url); setSupport(site.support_contact); setWa(site.whatsapp_number); setLogos(site.show_logos); setLinks(site.footer_links.map((l) => `${l.label} | ${l.url}`).join("\n")); }, [site]);
  async function save() {
    setErr(""); setMsg("");
    if (name.trim().length < 2 || name.length > 40) return setErr("Website name must be 2-40 characters.");
    if (logo.trim() && !/^https:\/\/\S+$/i.test(logo.trim())) return setErr("Logo must be an https:// image link (or leave empty).");
    let digits = wa.replace(/[\s+\-()]/g, "");
    if (/^03\d{9}$/.test(digits)) digits = "92" + digits.slice(1);      // 0300... -> 92300...
    if (digits && !/^\d{10,15}$/.test(digits)) return setErr("WhatsApp number: digits only, with country code, e.g. 923001234567.");
    const footer_links = [];
    for (const line of links.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const [label, url] = line.split("|").map((x) => x.trim());
      if (!label || !url || !/^(https?:\/\/\S+|\/\S*)$/i.test(url)) return setErr(`Footer link format: Label | https://link  (problem: "${line}")`);
      footer_links.push({ label, url });
    }
    setBusy(true);
    const { error } = await supabase.from("site_settings").update({ value: { name: name.trim(), logo_url: logo.trim(), support_contact: support.trim(), whatsapp_number: digits, show_logos: logos, currency: "PKR", footer_links }, updated_at: new Date().toISOString() }).eq("key", "site");
    setBusy(false); if (error) return setErr(error.message); await reload(); setMsg("Saved.");
  }
  return (
    <div className="max-w-xl space-y-4"><h1 className="text-xl font-semibold">Website Settings</h1>
      <div className="card space-y-3">
        <input className="input" placeholder="Website name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Logo image link (https://…, optional)" value={logo} onChange={(e) => setLogo(e.target.value)} />
        <input className="input" placeholder="Support contact (email, number or link, shown in footer)" value={support} onChange={(e) => setSupport(e.target.value)} />
        <label className="block text-sm">WhatsApp number for the chat button (leave empty to hide it)
          <input className="input mt-1" placeholder="923001234567" value={wa} onChange={(e) => setWa(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={logos} onChange={(e) => setLogos(e.target.checked)} />Show platform logos (YouTube, Facebook, TikTok…) next to services</label>
        <textarea className="input" rows={4} placeholder={"Footer links, one per line:\nTerms | https://example.com/terms\nPrivacy | https://example.com/privacy"} value={links} onChange={(e) => setLinks(e.target.value)} />
        <p className="text-xs text-slate-500">Currency is PKR. Payment account details are under Payment Settings.</p>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}{msg && <p className="text-sm text-green-700">{msg}</p>}
        <button className="btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button></div></div>
  );
}
