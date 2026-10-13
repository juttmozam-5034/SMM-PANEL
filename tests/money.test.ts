import { describe, expect, it } from "vitest";
import { formatPKR, orderTotal } from "../src/lib/money";
describe("orderTotal", () => {
  it("matches the spec example: 250 x 200 / 1000 = 50", () => expect(orderTotal(250, 200)).toBe(50));
  it("rounds to 2 decimals", () => expect(orderTotal(333, 1.5)).toBe(0.5));
  it("handles fractional prices", () => expect(orderTotal(1000, 0.35)).toBe(0.35));
  it("rejects zero, negative and non-integer quantities", () => {
    expect(() => orderTotal(0, 200)).toThrow();
    expect(() => orderTotal(-5, 200)).toThrow();
    expect(() => orderTotal(1.5, 200)).toThrow();
  });
});
describe("formatPKR", () => {
  it("formats with PKR prefix and 2 decimals", () => expect(formatPKR(50)).toBe("PKR 50.00"));
});
