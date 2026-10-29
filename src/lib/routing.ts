export type ReportType =
  | "pothole"
  | "street_light"
  | "flooding"
  | "rubbish"
  | "not_relevant";

export type Route = "publish" | "needs_approval" | "reject";

export function determineRoute(
  type: ReportType,
  priority: number,
  confidence: number,
  priorityThreshold = 4,
  confidenceThreshold = 0.7,
): Route {
  if (type === "not_relevant") {
    return "reject";
  }

  if (
    priority >= priorityThreshold ||
    confidence < confidenceThreshold
  ) {
    return "needs_approval";
  }

  return "publish";
}