export type ApiErrorKind =
  | 'authentication'
  | 'authorization'
  | 'network'
  | 'contract'
  | 'problem';

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
    public readonly problem?: ProblemDetails,
  ) {
    super(problem?.title ?? 'The request could not be completed.');
    this.name = 'ApiError';
  }
}
