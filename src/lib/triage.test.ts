
import { describe, expect, it } from "vitest";
import { findZone, isValidTriageRequest } from "./triage";

describe("isValidTriageRequest", () => {
  const validRequest = {
    id: "test-001",
    text: "A dangerous pothole on the road",
    lat: 6.935,
    lng: 79.852,
    reported_at: "2026-10-28T10:00:00Z",
  };

  it("accepts a valid request", () => {
    expect(isValidTriageRequest(validRequest)).toBe(true);
  });

  it("rejects a missing report ID", () => {
    const { id, ...request } = validRequest;
    expect(isValidTriageRequest(request)).toBe(false);
  });

  it("rejects text longer than 2000 characters", () => {
    expect(
      isValidTriageRequest({
        ...validRequest,
        text: "x".repeat(2001),
      }),
    ).toBe(false);
  });

  it("rejects invalid latitude", () => {
    expect(
      isValidTriageRequest({
        ...validRequest,
        lat: 100,
      }),
    ).toBe(false);
  });

  it("rejects unexpected properties", () => {
    expect(
      isValidTriageRequest({
        ...validRequest,
        unexpected: true,
      }),
    ).toBe(false);
  });
});

describe("findZone", () => {
  it("assigns valid Colombo coordinates to Z-01", () => {
    expect(findZone(79.852, 6.935)).toBe("Z-01");
  });

  it("assigns the nearest configured zone for outside coordinates", () => {
  expect(findZone(80.5, 7.5)).toBe("Z-06");
});
});
