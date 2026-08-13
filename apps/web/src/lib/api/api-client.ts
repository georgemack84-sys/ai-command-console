import { environment } from '@/config/environment';

import { ApiError } from './api-error';
import { parseProblemDetails } from './problem-details';
import {
  csrfHeaderName,
  csrfHeaderValue,
  isStateChangingMethod,
} from './request-policy';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export const emptyResponse = Symbol('empty-response');
export type EmptyResponse = typeof emptyResponse;
type AuthenticationFailureHandler = () => void;
const authenticationFailureHandlers = new Set<AuthenticationFailureHandler>();

export function registerAuthenticationFailureHandler(
  handler: AuthenticationFailureHandler,
): () => void {
  authenticationFailureHandlers.add(handler);
  return () => authenticationFailureHandlers.delete(handler);
}

function notifyAuthenticationFailure() {
  for (const handler of authenticationFailureHandlers) handler();
}

export interface ApiRequest<T> {
  path: `/api/v1/${string}`;
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
  parse: (value: unknown) => T;
}

function requestUrl(path: string): string {
  return new URL(path, environment.NEXT_PUBLIC_API_BASE_URL).toString();
}

async function responsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** The only browser request-response transport permitted in the frontend. */
export async function apiRequest<T>(request: ApiRequest<T>): Promise<T> {
  const method = request.method ?? 'GET';
  const headers = new Headers({ Accept: 'application/json' });
  if (request.body !== undefined)
    headers.set('Content-Type', 'application/json');
  if (isStateChangingMethod(method))
    headers.set(csrfHeaderName, csrfHeaderValue);
  let response: Response;
  try {
    response = await fetch(requestUrl(request.path), {
      method,
      credentials: 'include',
      headers,
      body:
        request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new ApiError('network');
  }
  const correlationId = response.headers.get('x-correlation-id') ?? undefined;
  if (response.status === 401) {
    notifyAuthenticationFailure();
    throw new ApiError('authentication', 401);
  }
  if (response.status === 403) throw new ApiError('authorization', 403);
  if (!response.ok) {
    const problem = parseProblemDetails(
      await responsePayload(response),
      correlationId,
    );
    throw new ApiError('problem', response.status, problem);
  }
  if (response.status === 204) return emptyResponse as T;
  const payload = await responsePayload(response);
  try {
    return request.parse(payload);
  } catch {
    throw new ApiError('contract', response.status);
  }
}
