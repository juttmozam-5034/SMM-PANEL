// Free, rule-based website assistant. No API, no cost: it matches the question against your
// services, FAQ and policy text (all editable from the admin panel) and answers from them only.
import { orderTotal } from "./money";

export type BotService = { service_code: number; name: string; description: string; min_qty: number; max_qty: number; price_per_1000: number; est_delivery: string; instructions: string; platforms: { name: string } | null; service_categories: { name: string } | null };
export type BotData = { enabled: boolean; greeting: string; services: BotService[]; faqs: { question: string; answer: string }[]; refund_policy: string; delivery_notes: string; extra: string; support_contact: string; min_deposit: number; methods: string[] };
export type Reply = { text: string; chips?: string[] };
export const CHIPS = ["Services and prices", "Delivery time", "Refund policy", "How do I add funds?"];

const STOP = new Set(["the", "a", "an", "is", "are", "of", "to", "for", "in", "on", "and", "or", "me", "my", "i", "you", "your", "do", "does", "can", "how", "what", "which", "kya", "hai", "hain", "ka", "ki", "ke", "ko", "se", "mein", "me", "ho", "kar", "karo", "karna", "please", "pls", "bata", "batao", "btao", "chahiye", "aur", "ye", "yeh", "wo", "woh", "kaise", "kese", "kitna", "kitne", "kitni", "mujhe", "muje", "aap", "we", "it", "this", "that", "with", "about", "tell", "give", "need", "want", "se", "par", "pe", "ya", "bhi", "hota", "hoti", "milta", "milti", "get"]);
const K: Record<string, string[]> = {
  greet: ["hi", "hello", "hey", "salam", "assalam", "aoa", "asalam", "slam", "hii"],
  price: ["price", "prices", "rate", "rates", "cost", "charges", "kitna", "kitne", "qeemat", "kimat", "paisay", "paise", "pricing", "per"],
  services: ["services", "service", "list", "available", "offer", "products", "packages"],
  delivery: ["delivery", "deliver", "time", "speed", "start", "kab", "jaldi", "hours", "days", "der", "waqt", "timing", "timings"],
  refund: ["refund", "refunds", "wapas", "return", "cancel", "cancelled", "partial", "dispute"],
  deposit: ["deposit", "fund", "funds", "easypaisa", "jazzcash", "payment", "pay", "tid", "wallet", "topup", "recharge", "paisa"],
  order: ["order", "orders", "place", "buy", "kharidna", "lagana", "lagayen"],
  status: ["status", "pending", "completed", "complete", "track", "tracking"],
  support: ["support", "help", "contact", "ticket", "admin", "whatsapp", "complaint", "complain", "number"],
};
const ALIAS: Record<string, string> = { yt: "youtube", ig: "instagram", insta: "instagram", fb: "facebook", tg: "telegram", tt: "tiktok", twitter: "x", view: "views", like: "likes", follower: "followers", subscriber: "subscribers", subs: "subscribers", member: "members", sub: "subscribers" };
const UR = new Set(["kitna", "kitne", "kitni", "kya", "kaise", "kese", "kab", "hai", "hain", "mein", "paisay", "paise", "wapas", "batao", "bata", "btao", "chahiye", "karna", "karo", "salam", "assalam", "aoa", "nahi", "mujhe", "muje", "aap", "der", "waqt", "jaldi"]);
const ALL_INTENT = new Set(Object.values(K).flat());

const tok = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ").split(/\s+/).filter(Boolean).map((t) => ALIAS[t] ?? t);
const content = (s: string) => tok(s).filter((t) => !STOP.has(t) && !ALL_INTENT.has(t) && !/^\d/.test(t));
const has = (t: string[], k: string) => t.some((x) => K[k].includes(x));
const pkr = (n: number) => "PKR " + Number(n).toLocaleString("en-PK", { maximumFractionDigits: 2 });

function quantity(text: string): number | null {
  const m = text.toLowerCase().replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k|m)?(?![a-z0-9])/);
  if (!m) return null; let n = parseFloat(m[1]); if (m[2] === "k") n *= 1000; if (m[2] === "m") n *= 1_000_000;
  return Number.isInteger(n) && n > 0 ? n : null;
}
function matchServices(q: string[], services: BotService[]) {
  if (q.length === 0) return [];
  const scored = services.map((s) => {
    const st = new Set(tok(`${s.name} ${s.platforms?.name ?? ""} ${s.service_categories?.name ?? ""}`));
    return { s, score: q.filter((t) => st.has(t)).length };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.length ? scored.filter((x) => x.score === scored[0].score).map((x) => x.s) : [];
}
const line = (s: BotService, ur: boolean) => `• #${s.service_code} ${s.name}: ${pkr(s.price_per_1000)} per 1000 | min ${s.min_qty}, max ${s.max_qty} | ${ur ? "delivery" : "delivery"}: ${s.est_delivery || (ur ? "bataya nahi gaya" : "not specified")}`;

export function answer(text: string, d: BotData): Reply {
  const raw = text.trim(); const t = tok(raw); const ur = t.some((x) => UR.has(x)) || /[\u0600-\u06ff]/.test(raw);
  const supportLine = d.support_contact ? (ur ? ` Ya rabta karein: ${d.support_contact}.` : ` Or contact: ${d.support_contact}.`) : "";
  const ticket = ur ? `Is ke liye apne account mein "Support Tickets" mein ticket kholein, hamari team jawab degi.${supportLine}` : `Please open a ticket in "Support Tickets" in your account and our team will reply.${supportLine}`;
  if (!raw) return { text: ur ? "Apna sawal likhein." : "Please type your question.", chips: CHIPS };

  const c = content(raw);
  const only = t.length <= 3 && has(t, "greet");
  if (only) return { text: d.greeting || (ur ? "Walaikum assalam! Aap kya poochna chahte hain?" : "Hi! How can I help you?"), chips: CHIPS };

  // 1. price calculation: "250 youtube views"
  const qty = quantity(raw); const found = matchServices(c, d.services);
  if (qty && found.length) {
    const rows = found.slice(0, 3).map((s) => {
      if (qty < s.min_qty || qty > s.max_qty) return `• ${s.name}: ${ur ? "quantity" : "quantity"} ${s.min_qty}-${s.max_qty} ${ur ? "ke darmiyan honi chahiye" : "only (min/max)"}.`;
      return `• ${s.name}: ${qty} × ${pkr(s.price_per_1000)} ÷ 1000 = ${pkr(orderTotal(qty, Number(s.price_per_1000)))}`;
    });
    return { text: (ur ? "Hisaab:\n" : "Estimated total:\n") + rows.join("\n") + (ur ? "\nOrder dene se pehle total aap ko dikhaya jata hai." : "\nThe final total is shown before you confirm an order.") };
  }

  // 2. FAQ (admin-written answers win when the question is a close match)
  let best: { a: string; dice: number; inter: number } | null = null;
  for (const f of d.faqs) {
    const fq = content(f.question); const set = new Set(fq); const inter = c.filter((x, i) => set.has(x) && c.indexOf(x) === i).length;
    const dice = fq.length + c.length ? (2 * inter) / (fq.length + c.length) : 0;
    if (!best || dice > best.dice) best = { a: f.answer, dice, inter };
  }
  if (best && best.inter >= 1 && (best.dice >= 0.5 || (best.inter >= 2 && best.dice >= 0.4))) return { text: best.a };

  // 3. topics
  if (has(t, "refund")) return { text: d.refund_policy || (ur ? "Refund policy abhi set nahi hai. " : "The refund policy is not set yet. ") + (d.refund_policy ? "" : ticket) };
  if (has(t, "support")) return { text: ur ? `Madad ke liye: ${ticket}` : `For help: ${ticket}` };
  if (has(t, "status")) return { text: ur ? "Apne order ka status \"My Orders\" mein dekhein: pending, processing, in progress ya completed. Orders hamari team haath se (manually) poore karti hai." : "Check your order status in \"My Orders\": pending, processing, in progress or completed. Orders are fulfilled manually by our team." };
  if (has(t, "deposit")) {
    const m = d.methods.length ? d.methods.join(" / ") : "EasyPaisa / JazzCash";
    return { text: ur ? `Funds add karne ke liye "Add Funds" kholein, ${m} chunein, diye gaye account par payment bhejein, phir amount aur TID likh kar request bhejein. Minimum deposit ${pkr(d.min_deposit)}. Payment admin haath se verify karta hai, manzoori ke baad hi wallet mein paise aate hain.` : `Open "Add Funds", choose ${m}, send the payment to the account shown, then submit the amount and the transaction ID (TID). Minimum deposit is ${pkr(d.min_deposit)}. An admin verifies payments manually and your wallet is credited only after approval.` };
  }
  if (has(t, "delivery") && found.length === 0) {
    const list = d.services.slice(0, 6).map((s) => `• ${s.name}: ${s.est_delivery || (ur ? "bataya nahi gaya" : "not specified")}`).join("\n");
    return { text: [d.delivery_notes, list].filter(Boolean).join("\n\n") || ticket };
  }
  if (has(t, "order") && found.length === 0) return { text: ur ? `Order dene ke liye: "New Order" kholein, platform, category aur service chunein, apna public link aur quantity likhein. Total khud dikhta hai, confirm par wallet se katta hai. Pehle "Add Funds" se wallet mein balance chahiye.` : `To order: open "New Order", choose a platform, category and service, paste your public link and enter the quantity. The total is shown first and deducted from your wallet on confirm. Add funds beforehand if your balance is low.` };

  // 4. services / prices / delivery for a matched service
  if (found.length) {
    const more = found.length > 5 ? (ur ? `\n...aur ${found.length - 5} services.` : `\n...and ${found.length - 5} more.`) : "";
    const detail = found.length === 1 ? [found[0].description, found[0].instructions ? (ur ? "Hidayat: " : "Instructions: ") + found[0].instructions : ""].filter(Boolean).join("\n") : "";
    return { text: found.slice(0, 5).map((s) => line(s, ur)).join("\n") + more + (detail ? "\n\n" + detail : "") };
  }
  if (has(t, "services") || has(t, "price")) {
    if (d.services.length === 0) return { text: ur ? "Abhi koi service list nahi hai. Jald hi shamil hongi." : "No services are listed yet. They will be added soon." };
    const platforms = [...new Set(d.services.map((s) => s.platforms?.name).filter(Boolean))];
    return { text: (ur ? "Hamare paas ye platforms hain: " : "We offer these platforms: ") + platforms.join(", ") + (ur ? ".\nKisi ka naam likhein (jaise \"YouTube views\") to price aur details bataunga.\n\n" : ".\nType one (e.g. \"YouTube views\") to see prices and details.\n\n") + d.services.slice(0, 5).map((s) => line(s, ur)).join("\n"), chips: platforms.slice(0, 4).map((p) => `${p} prices`) };
  }
  if (d.extra && c.length && tok(d.extra).some((x) => c.includes(x))) return { text: d.extra };

  return { text: ur ? `Maaf kijiye, mere paas is ka jawab nahi. ${ticket}` : `Sorry, I don't have an answer for that. ${ticket}`, chips: CHIPS };
}
