import { describe, expect, it } from 'vitest';
import { parsePublicEnvironment } from './environment-schema';

const valid = {
  NEXT_PUBLIC_APP_NAME: 'Proprium',
  NEXT_PUBLIC_APP_VERSION: '1.0.0',
  NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test',
  NEXT_PUBLIC_ENVIRONMENT: 'test',
};

describe('public environment', () => {
  it('accepts valid public configuration', () =>
    expect(parsePublicEnvironment(valid)).toEqual(valid));
  it('rejects missing configuration', () =>
    expect(() =>
      parsePublicEnvironment({ ...valid, NEXT_PUBLIC_APP_NAME: undefined }),
    ).toThrow());
  it('rejects invalid configuration', () =>
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: 'not-a-url',
      }),
    ).toThrow());
});
