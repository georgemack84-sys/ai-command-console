import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { KeyManagementServiceClient } from "@google-cloud/kms";
import { env, isProduction } from "@/src/config/env";
import { AppError } from "@/src/server/api/errors";

export type NuruAuditSignature = {
  algorithm: "Ed25519";
  keyId: string;
  publicKeySpkiBase64: string;
  valueBase64: string;
};

type SigningConfig = { keyId: string; privateKeyPkcs8Base64: string };

export function signNuruAuditPayload(canonicalPayload: string, config: SigningConfig): NuruAuditSignature {
  const privateKey = createPrivateKey({ key: Buffer.from(config.privateKeyPkcs8Base64, "base64"), format: "der", type: "pkcs8" });
  const publicKeySpkiBase64 = createPublicKey(privateKey).export({ format: "der", type: "spki" }).toString("base64");
  return { algorithm: "Ed25519", keyId: config.keyId, publicKeySpkiBase64, valueBase64: sign(null, Buffer.from(canonicalPayload, "utf8"), privateKey).toString("base64") };
}

type GcpKmsClient = Pick<KeyManagementServiceClient, "asymmetricSign" | "getPublicKey">;

function publicKeySpkiBase64(pem: string) {
  return pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, "");
}

export async function signGcpKmsNuruAuditPayload(canonicalPayload: string, keyVersion: string, client: GcpKmsClient = new KeyManagementServiceClient()): Promise<NuruAuditSignature> {
  const [publicKey] = await client.getPublicKey({ name: keyVersion });
  if (publicKey.algorithm !== "EC_SIGN_ED25519" || !publicKey.pem) throw new AppError(503, "audit_signing_algorithm_invalid", "Nuru audit signing requires a Cloud KMS EC_SIGN_ED25519 key version.");
  const [response] = await client.asymmetricSign({ name: keyVersion, data: Buffer.from(canonicalPayload, "utf8") });
  if (!response.signature) throw new AppError(503, "audit_signing_unavailable", "Cloud KMS returned no audit signature.");
  return { algorithm: "Ed25519", keyId: keyVersion, publicKeySpkiBase64: publicKeySpkiBase64(publicKey.pem), valueBase64: Buffer.from(response.signature).toString("base64") };
}

/** Production requires a Cloud KMS key or managed-secret injection. Local exports remain explicitly unsigned. */
export async function signConfiguredNuruAuditPayload(canonicalPayload: string): Promise<NuruAuditSignature | null> {
  const provider = env.NURU_AUDIT_SIGNING_PROVIDER ?? (env.NURU_AUDIT_SIGNING_PRIVATE_KEY_PKCS8_BASE64 ? "local_secret" : "gcp_kms");
  if (provider === "gcp_kms") {
    const keyVersion = env.NURU_GCP_KMS_CRYPTO_KEY_VERSION?.trim();
    if (!keyVersion) {
      if (isProduction()) throw new AppError(503, "audit_signing_unconfigured", "Nuru audit signing requires a configured Cloud KMS key version.");
      return null;
    }
    try {
      return await signGcpKmsNuruAuditPayload(canonicalPayload, keyVersion);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(503, "audit_signing_unavailable", "Cloud KMS audit signing is unavailable.");
    }
  }
  const keyId = env.NURU_AUDIT_SIGNING_KEY_ID?.trim();
  const privateKeyPkcs8Base64 = env.NURU_AUDIT_SIGNING_PRIVATE_KEY_PKCS8_BASE64?.trim();
  if (!keyId || !privateKeyPkcs8Base64) {
    if (isProduction()) throw new AppError(503, "audit_signing_unconfigured", "Nuru audit signing requires managed signing key configuration.");
    return null;
  }
  try {
    return signNuruAuditPayload(canonicalPayload, { keyId, privateKeyPkcs8Base64 });
  } catch {
    throw new AppError(503, "audit_signing_unavailable", "Nuru audit signing key material is unavailable or invalid.");
  }
}
