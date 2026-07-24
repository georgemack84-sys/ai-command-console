import '@testing-library/jest-dom/vitest';

Object.assign(process.env, {
  NEXT_PUBLIC_APP_NAME: 'Proprium Test',
  NEXT_PUBLIC_APP_VERSION: '0.1.0-test',
  NEXT_PUBLIC_API_BASE_URL: 'http://test-api.local',
  NEXT_PUBLIC_ENVIRONMENT: 'test',
});
