import Ajv2020 from "ajv/dist/2020";
import requestSchema from "../../contract/triage.request.schema.json";
import zonesData from "./zones.json";
import addFormats from "ajv-formats";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateRequest = ajv.compile(requestSchema);

export type TriageRequest = {
  id: string;
  text: string;
  lat: number;
  lng: number;
  reported_at: string;
  photo_url?: string | null;
};

export type Zone = {
  id: string;
  name: string;
  polygon: [number, number][];
};

const zones = zonesData.zones as unknown as Zone[];
/**
 * Validate a request against the assessment's exact JSON schema.
 */
export function isValidTriageRequest(
  value: unknown,
): value is TriageRequest {
  return validateRequest(value) as boolean;
}

/**
 * Ray-casting point-in-polygon check.
 * Polygon points are [longitude, latitude].
 */
function isInsidePolygon(
  lng: number,
  lat: number,
  polygon: [number, number][],
): boolean {
  let inside = false;

  for (
    let i = 0, j = polygon.length - 1;
    i < polygon.length;
    j = i++
  ) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

/**
 * Return the containing zone ID, or the nearest zone when
 * the point falls outside all configured zones.
 * Polygon points are [longitude, latitude].
 */
export function findZone(lng: number, lat: number): string {
  const match = zones.find((zone) =>
    isInsidePolygon(lng, lat, zone.polygon),
  );

  if (match) {
    return match.id;
  }

  let nearestZone = zones[0];
  let shortestDistance = Number.POSITIVE_INFINITY;

  for (const zone of zones) {
    for (const [zoneLng, zoneLat] of zone.polygon) {
      const distance =
        (zoneLng - lng) ** 2 + (zoneLat - lat) ** 2;

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestZone = zone;
      }
    }
  }

  return nearestZone.id;
}