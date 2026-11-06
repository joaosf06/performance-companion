import { describe, it, expect } from "vitest";
import { whatsappNumber } from "@/lib/freeTrial";

describe("whatsappNumber", () => {
  it("adds +351 to a 9-digit number", () => {
    expect(whatsappNumber("912 345 678")).toBe("351912345678");
  });
  it("keeps numbers that already have a country code", () => {
    expect(whatsappNumber("+351 912 345 678")).toBe("351912345678");
  });
  it("returns null for empty", () => {
    expect(whatsappNumber("")).toBeNull();
  });
});
