
import { describe, expect, it } from "vitest";
import { determineRoute } from "./routing";

describe("determineRoute", () => {
  it("rejects irrelevant reports", () => {
    expect(determineRoute("not_relevant", 1, 0.9)).toBe("reject");
  });

  it("requires approval for high-priority reports", () => {
    expect(determineRoute("pothole", 4, 0.9)).toBe("needs_approval");
  });

  it("requires approval for low-confidence reports", () => {
    expect(determineRoute("pothole", 2, 0.6)).toBe("needs_approval");
  });

  it("publishes ordinary reports", () => {
    expect(determineRoute("pothole", 2, 0.9)).toBe("publish");
  });
});
