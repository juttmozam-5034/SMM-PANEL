const MAP: Record<string, string> = {
  insufficient_balance: "Insufficient wallet balance.",
  account_blocked: "Your account is blocked. Please contact support.",
  service_unavailable: "This service is not available.",
  invalid_quantity: "Quantity is outside the allowed range.",
  invalid_url: "Please enter a valid link starting with http:// or https://",
  price_changed: "The price changed. Please review the new total and try again.",
  not_authenticated: "Please log in again.",
  forbidden: "You are not allowed to do this.",
  cannot_block_self: "You cannot block your own account.",
  reason_required: "Please enter a reason (at least 3 characters).",
  user_not_found: "Customer not found.",
  invalid_amount: "Enter a valid amount above 0.",
  duplicate_trx_id: "This transaction ID was already submitted.",
  below_minimum: "Amount is below the minimum deposit.",
  method_disabled: "This payment method is currently unavailable.",
  already_reviewed: "This request was already reviewed.",
  order_final: "This order is final (cancelled, refunded or partial) and cannot be changed.",
  invalid_refund: "Refund amount must be above 0 and not more than the unrefunded amount.",
};
export function friendlyError(msg?: string): string {
  if (!msg) return "Something went wrong. Please try again.";
  for (const k of Object.keys(MAP)) if (msg.includes(k)) return MAP[k];
  return msg;
}
