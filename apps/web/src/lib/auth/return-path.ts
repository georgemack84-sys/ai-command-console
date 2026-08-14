declare const safePath: unique symbol;
export type SafeInternalPath = string & { readonly [safePath]: true };
export const defaultAuthenticatedPath = '/dashboard' as SafeInternalPath;

const excludedPaths = new Set(['/login', '/logout', '/auth']);
export function resolveSafeReturnPath(
  candidate: string | null | undefined,
): SafeInternalPath {
  if (
    !candidate ||
    candidate.length > 2048 ||
    /[\\\u0000-\u001f\u007f]/.test(candidate)
  )
    return defaultAuthenticatedPath;
  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return defaultAuthenticatedPath;
  }
  if (decoded !== candidate) return resolveSafeReturnPath(decoded);
  if (!candidate.startsWith('/') || candidate.startsWith('//'))
    return defaultAuthenticatedPath;
  try {
    const parsed = new URL(candidate, 'https://proprium.invalid');
    if (
      parsed.origin !== 'https://proprium.invalid' ||
      excludedPaths.has(parsed.pathname)
    )
      return defaultAuthenticatedPath;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` as SafeInternalPath;
  } catch {
    return defaultAuthenticatedPath;
  }
}
