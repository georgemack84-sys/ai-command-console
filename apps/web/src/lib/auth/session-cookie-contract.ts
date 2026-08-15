/** ADR-013 defines the frontend dependency on the backend cookie contract. */
export const sessionCookieContract = Object.freeze({
  productionName: '__Host-proprium_session',
  nonProductionName: 'proprium_session',
  maximumLength: 4096,
});

export function sessionCookieName(environment: string): string {
  return environment === 'production'
    ? sessionCookieContract.productionName
    : sessionCookieContract.nonProductionName;
}
