import { describe, expect, it } from "vitest";
import { classifyWithRules } from "./classifier";

describe("classifyWithRules fallback classifier", () => {
  it("classifies a pothole report", () => {
    const result = classifyWithRules(
      "Deep pothole by the bus stop, a scooter nearly fell",
    );

    expect(result.type).toBe("pothole");
    expect(result.size).toBe("large");
    expect(result.priority).toBe(4);
  });

  it("classifies a flooding report", () => {
    const result = classifyWithRules(
      "Water rising toward the school entrance, children waiting outside",
    );

    expect(result.type).toBe("flooding");
    expect(result.priority).toBe(4);
  });

  it("classifies a street-light report", () => {
    const result = classifyWithRules(
      "Street lights on the hospital road all out tonight",
    );

    expect(result.type).toBe("street_light");
    expect(result.priority).toBe(4);
  });

  it("marks an unsupported report as not relevant", () => {
    const result = classifyWithRules(
      "I would like information about the city office",
    );

    expect(result.type).toBe("not_relevant");
    expect(result.priority).toBe(1);
  });

  it("returns a valid confidence and priority", () => {
    const result = classifyWithRules("A pothole is blocking the road");

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.priority).toBeGreaterThanOrEqual(1);
    expect(result.priority).toBeLessThanOrEqual(5);
  });
});
