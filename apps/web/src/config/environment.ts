import { parsePublicEnvironment } from './environment-schema';

// This is the sole application module permitted to read process.env.
export const environment = Object.freeze(parsePublicEnvironment(process.env));
