import { supabase } from "./supabase";
import type { BotData, BotService } from "./botEngine";
export async function loadBotData(): Promise<BotData> {
  const [svc, faq, bot, site, pay] = await Promise.all([
    supabase.from("services").select("kind,service_code,name,description,min_qty,max_qty,price_per_1000,est_delivery,instructions,platforms(name),service_categories(name)").eq("status", "active").order("service_code").limit(200),
    supabase.from("bot_faqs").select("question,answer").eq("is_active", true).order("sort_order").limit(100),
    supabase.from("site_settings").select("value").eq("key", "bot").maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "site").maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "payment").maybeSingle(),
  ]);
  const b = (bot.data?.value ?? { enabled: false }) as Record<string, any>; const s = (site.data?.value ?? {}) as Record<string, any>; const p = (pay.data?.value ?? {}) as Record<string, any>;
  return {
    enabled: b.enabled !== false && !!bot.data, greeting: b.greeting ?? "", refund_policy: b.refund_policy ?? "", delivery_notes: b.delivery_notes ?? "", extra: b.extra ?? "",
    support_contact: s.support_contact ?? "", min_deposit: Number(p.min_deposit ?? 0),
    methods: (["easypaisa", "jazzcash"] as const).filter((m) => p[m]?.enabled).map((m) => (m === "easypaisa" ? "EasyPaisa" : "JazzCash")),
    services: (svc.data ?? []) as unknown as BotService[], faqs: (faq.data ?? []) as { question: string; answer: string }[],
  };
}
