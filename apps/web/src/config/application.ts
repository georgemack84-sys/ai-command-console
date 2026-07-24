import { environment } from './environment';

export const application = Object.freeze({
  name: environment.NEXT_PUBLIC_APP_NAME,
  version: environment.NEXT_PUBLIC_APP_VERSION,
  apiBaseUrl: environment.NEXT_PUBLIC_API_BASE_URL,
  environment: environment.NEXT_PUBLIC_ENVIRONMENT,
});
