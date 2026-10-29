import { describe, expect, it, vi } from "vitest";
import { classifyWithFallback } from "./triage-fallback";

describe("classifyWithFallback", () => {
  it("uses rules when AI returns null", async () => {
    const result = await classifyWithFallback(
      "A deep pothole is dangerous for cyclists",
      vi.fn().mockResolvedValue(null),
    );

    expect(result.triaged_by).toBe("rules");
    expect(result.classification.type).toBe("pothole");
    expect(result.classification.confidence).toBe(0.65);
  });

  it("uses rules when AI throws an error", async () => {
    const result = await classifyWithFallback(
      "A deep pothole is dangerous for cyclists",
      vi.fn().mockRejectedValue(new Error("AI unavailable")),
    );

    expect(result.triaged_by).toBe("rules");
    expect(result.classification.type).toBe("pothole");
    expect(result.classification.confidence).toBe(0.65);
  });

  it("uses the AI classification when AI succeeds", async () => {
    const aiClassification = {
      type: "rubbish" as const,
      size: "small" as const,
      priority: 2,
      confidence: 0.95,
      reason: "Small rubbish pile",
    };

    const result = await classifyWithFallback(
      "A deep pothole is dangerous for cyclists",
      vi.fn().mockResolvedValue(aiClassification),
    );

    expect(result.triaged_by).toBe("model");
    expect(result.classification).toEqual(aiClassification);
  });
});