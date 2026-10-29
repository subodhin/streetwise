
import { describe, expect, it } from "vitest";
import { isValidTriageResponse } from "./triage-response";

const validResponse = {
  id: "test-001",
  type: "pothole",
  size: "medium",
  priority: 3,
  zone: "Z-01",
  confidence: 0.9,
  reason: "A pothole was reported on the road.",
  route: "publish",
  triaged_by: "model",
};

describe("isValidTriageResponse", () => {
  it("accepts a valid response", () => {
    expect(isValidTriageResponse(validResponse)).toBe(true);
  });

  it("rejects an invalid report type", () => {
    expect(
      isValidTriageResponse({ ...validResponse, type: "graffiti" }),
    ).toBe(false);
  });

  it("rejects a priority outside 1–5", () => {
    expect(
      isValidTriageResponse({ ...validResponse, priority: 6 }),
    ).toBe(false);
  });

  it("rejects an invalid zone", () => {
    expect(
      isValidTriageResponse({ ...validResponse, zone: "Z-99" }),
    ).toBe(false);
  });

  it("rejects unexpected properties", () => {
    expect(
      isValidTriageResponse({ ...validResponse, extra: true }),
    ).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { reason, ...response } = validResponse;
    expect(isValidTriageResponse(response)).toBe(false);
  });
});
