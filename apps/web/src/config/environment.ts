import { parsePublicEnvironment } from './environment-schema';

// This is the sole application module permitted to read process.env. Explicit
// reads let Next inline these public values in browser bundles; passing the
// whole process.env object does not.
export const environment = Object.freeze(
  parsePublicEnvironment({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  }),
);
