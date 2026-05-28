export function evaluateDeprecationPolicy(input: {
  deprecated?: boolean;
  sunsetAt?: string;
}) {
  return {
    deprecated: input.deprecated === true,
    sunsetAt: input.sunsetAt,
  };
}
