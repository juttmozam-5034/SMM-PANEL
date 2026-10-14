import { describe, expect, it } from "vitest";
import { answer, type BotData } from "../src/lib/botEngine";
const svc = (code: number, name: string, platform: string, cat: string, price: number) => ({ service_code: code, name, description: "", min_qty: 100, max_qty: 10000, price_per_1000: price, est_delivery: "0-24 hours", instructions: "", platforms: { name: platform }, service_categories: { name: cat } });
const data: BotData = { enabled: true, greeting: "Hello!", refund_policy: "Cancelled orders are refunded to your wallet.", delivery_notes: "Delivery is manual.", extra: "", support_contact: "", min_deposit: 100, methods: ["EasyPaisa"],
  services: [svc(1, "YouTube Views", "YouTube", "Views", 200), svc(2, "Instagram Likes", "Instagram", "Likes", 150)],
  faqs: [{ question: "Is payment verified automatically?", answer: "No, manually." }] };
describe("bot engine", () => {
  it("calculates a total", () => expect(answer("250 youtube views", data).text).toContain("PKR 50"));
  it("understands k and roman urdu", () => expect(answer("1k instagram likes ka rate kitna hai", data).text).toContain("PKR 150"));
  it("rejects quantity outside limits", () => expect(answer("50 youtube views", data).text).toContain("100-10000"));
  it("lists a service price", () => expect(answer("youtube views price", data).text).toContain("PKR 200 per 1000"));
  it("answers refunds from the policy text", () => expect(answer("refund policy", data).text).toContain("refunded to your wallet"));
  it("matches an FAQ", () => expect(answer("is payment verified automatically", data).text).toBe("No, manually."));
  it("falls back to a ticket", () => expect(answer("quantum physics", data).text).toContain("ticket"));
});
