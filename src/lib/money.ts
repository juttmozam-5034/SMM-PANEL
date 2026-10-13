/** Total = quantity x pricePer1000 / 1000, rounded to 2dp. The database function place_order() is authoritative. */
export function orderTotal(quantity: number, pricePer1000: number): number {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("invalid_quantity");
  return Math.round(((quantity * pricePer1000) / 1000 + Number.EPSILON) * 100) / 100;
}
export const formatPKR = (n: number | string) =>
  "PKR " + Number(n).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
