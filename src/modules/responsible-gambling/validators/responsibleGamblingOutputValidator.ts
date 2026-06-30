import { classifyGamblingOutput } from "../classifier/gamblingOutputClassifier";

export function validateInformationalOnlyOutput(output: string, fields?: Record<string, unknown>) {
  return classifyGamblingOutput({ requested_output: output, output_fields: fields });
}
