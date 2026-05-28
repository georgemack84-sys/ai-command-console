import type { ZodTypeAny } from "zod";

import { compileStrictSchema } from "./schemaCompiler";

export function strictParse<TSchema extends ZodTypeAny>(schema: TSchema, payload: unknown) {
  return compileStrictSchema(schema).safeParse(payload);
}
