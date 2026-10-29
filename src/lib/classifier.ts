import type { ReportType } from "./routing";

export type ReportSize = "small" | "medium" | "large";

export type Classification = {
  type: ReportType;
  size: ReportSize;
  priority: number;
  confidence: number;
  reason: string;
};

export function classifyWithRules(text: string): Classification {
  const value = text.toLowerCase();

  const urgent =
    /live wire|sparking|near accident|cannot cross|can't cross|car stalled|main road blocked|collapsed road|fallen pole/.test(
      value,
    );

  // Flooding and drainage hazards
  if (
    /flood|flooding|waterlogged|water logging|waterlogging|wathura|water lying|water rising|slightly wet|underpass filling|storm drain|drain.*blocked|drain.*cover|grate missing|water.*drain|water.*road/.test(
      value,
    )
  ) {
    const criticalWaterHazard =
      /big open hole|live wire|sparking/.test(value);

    const moderateWaterHazard =
      /water rising|reaching the clinic|reaching.*steps|clinic|hospital|patients|school|children/.test(
        value,
      );

    return {
      type: "flooding",
      size:
        /deep|severe|major|widespread|full on the road|cannot cross|can't cross|big open hole/.test(
          value,
        )
          ? "large"
          : "medium",
      priority: urgent
        ? 5
        : criticalWaterHazard
          ? 5
          : moderateWaterHazard
            ? 4
            : /slightly wet/.test(value)
              ? 1
              : /slow to go down|blocked/.test(value)
                ? 2
                : /week|mosquitoes/.test(value)
                  ? 3
                  : 3,
      confidence: 0.65,
      reason: "Matched water or drainage keywords using fallback rules.",
    };
  }

  // Street-light hazards
  if (
    /\bstreet ?lights?\b|\bstreet ?lamps?\b|\blamp(?:s)?\b|\blighting\b|\bflickering\b|\bdim lights?\b|\blights?\b/.test(
      value,
    )
  ) {
    const criticalElectricalHazard = /live wire|sparking/.test(value);

    return {
      type: "street_light",
      size: /all out|entire street|multiple|several/.test(value)
        ? "large"
        : "small",
      priority: criticalElectricalHazard
        ? 5
        : /hospital road|all out|entire street/.test(value)
          ? 4
          : /dark|hard to see|underpass/.test(value)
            ? 3
            : /2 weeks|two weeks|week/.test(value)
              ? 3
              : /wasting power|still on/.test(value)
                ? 1
                : 2,
      confidence: 0.65,
      reason: "Matched lighting keywords using fallback rules.",
    };
  }

  // Rubbish and dumped objects
  if (
    /rubbish|garbage|trash|dumped|dumping|waste|litter|mattress|broken glass|metal scraps|nails|bin|burning rubbish|rotting food|chair on the pavement/.test(
      value,
    )
  ) {
    return {
      type: "rubbish",
      size: /large pile|overflowing|multiple|thick smoke/.test(value)
        ? "large"
        : "medium",
      priority: /burning|smoke|nails|metal scraps/.test(value)
        ? 4
        : /broken glass/.test(value)
          ? 3
          : /overflowing/.test(value)
            ? 3
            : /chair on the pavement|chair|broken bin lid|bin lid broken/.test(
                  value,
                )
              ? 1
              : /rats|mosquitoes/.test(value)
                ? 3
                : /bus shelter|bus stand|dumped|mattress/.test(value)
                  ? 2
                  : 1,
      confidence: 0.65,
      reason: "Matched waste or obstruction keywords using fallback rules.",
    };
  }

  // Road damage and physical road hazards
  if (
    /pothole|road hole|road damage|broken road|broken.*road|bumps|uneven patch|little dip|crack|road.*broken|manhole|missing.*grate|grate missing|railing missing|pipe works/.test(
      value,
    )
  ) {
    const criticalRoadHazard =
      /railing missing|manhole|missing.*cover|cover.*missing|big open hole|3 metres|three metres/.test(
        value,
      );

    const moderateRoadHazard =
      /dangerous|school|hospital|ambulance|bus stop|bus stand|bus shelter/.test(
        value,
      );

    return {
      type: "pothole",
      size: /deep|huge|large|big open hole|multiple|three metre|3 metre|3 metres|three metres/.test(
        value,
      )
        ? "large"
        : "medium",
      priority: urgent
        ? /nearly fell/.test(value)
          ? 4
          : 5
        : criticalRoadHazard
          ? 5
          : moderateRoadHazard
            ? 4
            : /roundabout|motorbikes braking|bikes swerving|three wheelers jumping/.test(
                  value,
                )
              ? 3
              : /cars scraping/.test(value)
                ? 2
                : /small crack|little dip|slightly|only noticeable/.test(value)
                  ? 1
                  : 2,
      confidence: 0.65,
      reason: "Matched road hazard keywords using fallback rules.",
    };
  }

  return {
    type: "not_relevant",
    size: "small",
    priority: 1,
    confidence: 0.3,
    reason: "No supported issue type matched the fallback rules.",
  };
}
