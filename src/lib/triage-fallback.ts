import {
  classifyWithRules,
  type Classification,
} from "./classifier";

export async function classifyWithFallback(
  text: string,
  classifyWithAI: () => Promise<Classification | null>,
): Promise<{
  classification: Classification;
  triaged_by: "model" | "rules";
}> {
  try {
    const aiClassification = await classifyWithAI();

    if (aiClassification) {
      return {
        classification: aiClassification,
        triaged_by: "model",
      };
    }
  } catch {
    // If AI fails, use the rules-based classifier.
  }

  return {
    classification: classifyWithRules(text),
    triaged_by: "rules",
  };
}