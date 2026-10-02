import { GoogleAuth } from "google-auth-library";

const projectId = "proprium-srvr1";
const serviceAccountId = "nuru-runtime";
const serviceAccountEmail = `${serviceAccountId}@${projectId}.iam.gserviceaccount.com`;
const keyName = `projects/${projectId}/locations/us-east1/keyRings/nuru-audit/cryptoKeys/audit-signing`;
const member = `serviceAccount:${serviceAccountEmail}`;

async function main() {
  const client = await new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] }).getClient();
  const request = async <T>(options: { url: string; method?: string; data?: unknown }) => (await client.request<T>(options)).data;

  try {
    await request({ url: `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${serviceAccountEmail}` });
    console.log(`Service account already exists: ${serviceAccountEmail}`);
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status !== 404) throw error;
    await request({
      url: `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts`,
      method: "POST",
      data: { accountId: serviceAccountId, serviceAccount: { displayName: "Nuru Cloud Run runtime" } },
    });
    console.log(`Created service account: ${serviceAccountEmail}`);
  }

  const policy = await request<{ bindings?: Array<{ role: string; members?: string[] }>; etag?: string; version?: number }>({
    url: `https://cloudkms.googleapis.com/v1/${keyName}:getIamPolicy`,
    method: "POST",
    data: {},
  });
  const bindings = policy.bindings ?? [];
  const signerBinding = bindings.find((binding) => binding.role === "roles/cloudkms.signerVerifier");
  const changed = !signerBinding?.members?.includes(member);
  if (changed) {
    if (signerBinding) signerBinding.members = [...(signerBinding.members ?? []), member];
    else bindings.push({ role: "roles/cloudkms.signerVerifier", members: [member] });
    await request({
      url: `https://cloudkms.googleapis.com/v1/${keyName}:setIamPolicy`,
      method: "POST",
      data: { policy: { ...policy, bindings } },
    });
    console.log(`Granted Cloud KMS Signer/Verifier on ${keyName}`);
  } else {
    console.log("Cloud KMS Signer/Verifier role already granted.");
  }

  console.log(JSON.stringify({ projectId, serviceAccountEmail, keyName, role: "roles/cloudkms.signerVerifier" }, null, 2));
}

void main();
