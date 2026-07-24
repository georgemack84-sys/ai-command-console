export const csrfHeaderName = 'X-Proprium-CSRF';
export const csrfHeaderValue = '1';
export const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isStateChangingMethod(method: string): boolean {
  return stateChangingMethods.has(method.toUpperCase());
}
