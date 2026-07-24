import type { ProblemDetails } from './api-error';

export function parseProblemDetails(
  value: unknown,
  correlationId?: string,
): ProblemDetails | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.title !== 'string' && typeof record.type !== 'string')
    return undefined;
  return {
    type: typeof record.type === 'string' ? record.type : undefined,
    title: typeof record.title === 'string' ? record.title : undefined,
    status: typeof record.status === 'number' ? record.status : undefined,
    detail: typeof record.detail === 'string' ? record.detail : undefined,
    instance: typeof record.instance === 'string' ? record.instance : undefined,
    correlationId,
  };
}
