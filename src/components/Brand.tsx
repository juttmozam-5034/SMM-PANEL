import { useSite } from "../lib/site";
export default function Brand({ dark = false, size = "h-9 w-9" }: { dark?: boolean; size?: string }) {
  const { site } = useSite();
  return <span className={`flex items-center gap-2 text-lg font-semibold ${dark ? "text-slate-900" : "text-white"}`}>
    {site.logo_url && <img src={site.logo_url} alt={`${site.name} logo`} className={`${size} rounded object-contain`} />}{site.name}</span>;
}
