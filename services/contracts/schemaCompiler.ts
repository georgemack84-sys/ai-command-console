import type { ZodRawShape, ZodTypeAny, ZodObject } from "zod";

export function compileStrictSchema<TSchema extends ZodTypeAny>(schema: TSchema): TSchema {
  const candidate = schema as ZodTypeAny & { strict?: () => ZodTypeAny };
  return (typeof candidate.strict === "function" ? candidate.strict() : schema) as TSchema;
}

export function inspectSchema(schema: ZodTypeAny) {
  const objectLike = schema as ZodObject<ZodRawShape>;
  const shape = typeof objectLike.shape === "object" ? objectLike.shape : undefined;
  const keys = shape ? Object.keys(shape).sort() : [];
  return {
    typeName: (schema as any)?._def?.typeName || schema.constructor.name,
    keys,
  };
}
