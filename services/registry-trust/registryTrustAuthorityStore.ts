import type { RegistryTrustAuthority } from "./registryTrustTypes";

export type RegistryTrustAuthorityStore = Readonly<{
  getByAuthorityId(authorityId: string): RegistryTrustAuthority | null;
  getBySigningKeyId(signingKeyId: string): RegistryTrustAuthority | null;
  list(): readonly RegistryTrustAuthority[];
}>;

export function createRegistryTrustAuthorityStore(
  authorities: readonly RegistryTrustAuthority[],
): RegistryTrustAuthorityStore {
  const byAuthorityId = new Map(authorities.map((authority) => [authority.authorityId, authority]));
  const bySigningKeyId = new Map(authorities.map((authority) => [authority.signingKeyId, authority]));

  return {
    getByAuthorityId(authorityId) {
      return byAuthorityId.get(authorityId) ?? null;
    },
    getBySigningKeyId(signingKeyId) {
      return bySigningKeyId.get(signingKeyId) ?? null;
    },
    list() {
      return authorities;
    },
  };
}

