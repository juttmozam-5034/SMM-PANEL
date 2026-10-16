export type Platform = { id: string; name: string; is_active: boolean };
export type Category = { id: string; name: string; is_active: boolean };
export type Service = {
  id: string; service_code: number; name: string; platform_id: string; category_id: string; description: string;
  min_qty: number; max_qty: number; price_per_1000: number; est_delivery: string; instructions: string;
  status: "active" | "inactive" | "archived"; is_sample: boolean; kind: "order" | "fixed" | "request";
};
export type Order = {
  id: string; order_no: number; service_name: string; platform_name: string; target_url: string; quantity: number;
  total_price: number; status: string; created_at: string; details?: string | null;
};
