const MAP: Record<string, string> = {
  insufficient_balance: "Insufficient wallet balance.",
  account_blocked: "Your account is blocked. Please contact support.",
  service_unavailable: "This service is not available.",
  invalid_quantity: "Quantity is outside the allowed range.",
  invalid_url: "Please enter a valid link starting with http:// or https://",
  price_changed: "The price changed. Please review the new total and try again.",
  not_authenticated: "Please log in again.",
  forbidden: "You are not allowed to do this.",
};
export function friendlyError(msg?: string): string {
  if (!msg) return "Something went wrong. Please try again.";
  for (const k of Object.keys(MAP)) if (msg.includes(k)) return MAP[k];
  return msg;
}
