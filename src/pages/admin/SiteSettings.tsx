import { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "../../lib/supabase";
import { useSite } from "../../lib/site";
export default function SiteSettings() {
  const { site, reload } = useSite();
  const [name, setName] = useState(""); const [logo, setLogo] = useState(""); const [support, setSupport] = useState(""); const [wa, setWa] = useState(""); const [links, setLinks] = useState(""); const [logos, setLogos] = useState(true); const [uploading, setUploading] = useState(false);
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
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; setErr(""); setMsg("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) return setErr("Logo must be a PNG, JPG or WebP image.");
    if (f.size > 1024 * 1024) return setErr("Logo must be smaller than 1 MB.");
    setUploading(true);
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, f, { contentType: f.type, cacheControl: "3600" });
    setUploading(false);
    if (error) return setErr(error.message + " (Run 0010_branding.sql first.)");
    setLogo(supabase.storage.from("branding").getPublicUrl(path).data.publicUrl); setMsg("Logo uploaded. Press Save settings to apply it.");
  }
  return (
    <div className="max-w-xl space-y-4"><h1 className="text-xl font-semibold">Website Settings</h1>
      <div className="card space-y-3">
        <input className="input" placeholder="Website name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <div className="text-sm font-medium">Logo</div>
          <div className="flex items-center gap-3">{logo ? <img src={logo} alt="Logo preview" className="h-14 w-14 rounded bg-slate-800 object-contain p-1" /> : <div className="flex h-14 w-14 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">No logo</div>}
            <div className="space-y-1"><label className="btn cursor-pointer">{uploading ? "Uploading…" : "Upload logo"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={upload} /></label>
              {logo && <button type="button" className="ml-2 text-sm text-red-600" onClick={() => setLogo("")}>Remove</button>}</div></div>
          <p className="text-xs text-slate-500">PNG, JPG or WebP, under 1 MB. A square image with a transparent background works best. It is also used as the browser tab icon.</p>
          <input className="input" placeholder="…or paste an image link (https://…)" value={logo} onChange={(e) => setLogo(e.target.value)} /></div>
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
