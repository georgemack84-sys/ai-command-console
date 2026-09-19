/**
 * Next.js 16's server declaration references the emerging URL Pattern API.
 * TypeScript's DOM library does not declare it yet, so the app carries this
 * minimal standards-compatible declaration until that library catches up.
 */
interface URLPatternInit {
  baseURL?: string;
  username?: string;
  password?: string;
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

type URLPatternInput = URLPatternInit | string;

interface URLPatternOptions {
  ignoreCase?: boolean;
}

interface URLPatternComponentResult {
  input: string;
  groups: Record<string, string | undefined>;
}

interface URLPatternResult {
  inputs: URLPatternInput[];
  protocol: URLPatternComponentResult;
  username: URLPatternComponentResult;
  password: URLPatternComponentResult;
  hostname: URLPatternComponentResult;
  port: URLPatternComponentResult;
  pathname: URLPatternComponentResult;
  search: URLPatternComponentResult;
  hash: URLPatternComponentResult;
}

declare class URLPattern {
  constructor(
    input?: URLPatternInput,
    baseURL?: string | URL,
    options?: URLPatternOptions,
  );
  test(input?: URLPatternInput, baseURL?: string | URL): boolean;
  exec(
    input?: URLPatternInput,
    baseURL?: string | URL,
  ): URLPatternResult | null;
  readonly protocol: string;
  readonly username: string;
  readonly password: string;
  readonly hostname: string;
  readonly port: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
}
