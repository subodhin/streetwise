import Ajv2020 from "ajv/dist/2020";
import responseSchema from "../../contract/triage.response.schema.json";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateResponse = ajv.compile(responseSchema);

export function isValidTriageResponse(value: unknown): boolean {
  return validateResponse(value) as boolean;
}
