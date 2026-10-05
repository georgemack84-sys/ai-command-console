import { generateKeyPairSync, sign, verify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signGcpKmsNuruAuditPayload, signNuruAuditPayload } from "@/src/server/services/nuru-audit-signing-service";

describe("Nuru audit signing", () => {
  it("signs a canonical audit payload with Ed25519 and exposes a verifiable public key", () => {
    const { privateKey } = generateKeyPairSync("ed25519");
    const privateKeyPkcs8Base64 = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
    const canonicalPayload = '{"auditEvents":[],"exportVersion":"NURU_TANDEM_CANDIDATE_AUDIT_V1"}';
    const signature = signNuruAuditPayload(canonicalPayload, { keyId: "nuru-audit-test-1", privateKeyPkcs8Base64 });
    expect(signature.algorithm).toBe("Ed25519");
    expect(verify(null, Buffer.from(canonicalPayload), { key: Buffer.from(signature.publicKeySpkiBase64, "base64"), format: "der", type: "spki" }, Buffer.from(signature.valueBase64, "base64"))).toBe(true);
  });

  it("uses the Cloud KMS raw-data signing path for an EC_SIGN_ED25519 key", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const canonicalPayload = '{"auditEvents":[],"exportVersion":"NURU_TANDEM_CANDIDATE_AUDIT_V1"}';
    const client = {
      getPublicKey: async () => [{ algorithm: "EC_SIGN_ED25519", pem: publicKey.export({ format: "pem", type: "spki" }).toString() }],
      asymmetricSign: async ({ data }: { data: Buffer }) => [{ signature: sign(null, data, privateKey) }],
    };
    const signature = await signGcpKmsNuruAuditPayload(canonicalPayload, "projects/test/locations/us/keyRings/nuru/cryptoKeys/audit/cryptoKeyVersions/1", client as never);
    expect(signature.keyId).toContain("cryptoKeyVersions/1");
    expect(verify(null, Buffer.from(canonicalPayload), { key: Buffer.from(signature.publicKeySpkiBase64, "base64"), format: "der", type: "spki" }, Buffer.from(signature.valueBase64, "base64"))).toBe(true);
  });
});
