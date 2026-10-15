import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
export type FooterLink = { label: string; url: string };
export type Site = { name: string; logo_url: string; support_contact: string; whatsapp_number: string; show_logos: boolean; footer_links: FooterLink[] };
const DEFAULT: Site = { name: "SocialBoost", logo_url: "", support_contact: "", whatsapp_number: "", show_logos: true, footer_links: [] };
const Ctx = createContext<{ site: Site; reload: () => Promise<void> }>({ site: DEFAULT, reload: async () => {} });
export const useSite = () => useContext(Ctx);
export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<Site>(DEFAULT);
  const reload = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "site").maybeSingle();
    const v = (data?.value ?? {}) as Partial<Site>;
    const merged = { ...DEFAULT, ...v, footer_links: v.footer_links ?? [] };
    setSite(merged); document.title = merged.name;
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return <Ctx.Provider value={{ site, reload }}>{children}</Ctx.Provider>;
}
