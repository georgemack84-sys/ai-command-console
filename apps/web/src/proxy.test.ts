import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { sessionCookieContract } from '@/lib/auth/session-cookie-contract';
import { proxy } from './proxy';

function request(cookie?: string) {
  return new NextRequest('https://app.proprium.test/dashboard?tab=recent', {
    headers: cookie ? { cookie } : undefined,
  });
}
describe('protected-route admission proxy', () => {
  it('redirects missing and over-length cookies to a safe login return path', () => {
    expect(proxy(request()).headers.get('location')).toBe(
      'https://app.proprium.test/login?returnTo=%2Fdashboard%3Ftab%3Drecent',
    );
    const oversized = 'a'.repeat(sessionCookieContract.maximumLength + 1);
    expect(
      proxy(request(`${sessionCookieContract.name}=${oversized}`)).headers.get(
        'location',
      ),
    ).toContain('/login?returnTo=');
  });
  it('admits any non-empty opaque value within the canonical length', () => {
    expect(
      proxy(request(`${sessionCookieContract.name}=not-a-token`)).status,
    ).toBe(200);
    expect(proxy(request(`${sessionCookieContract.name}=a.b.c`)).status).toBe(
      200,
    );
  });
});
