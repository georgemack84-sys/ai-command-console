import {
  getMemoryKnowledgeBundle,
  runMemoryKnowledge,
  validateMemoryKnowledge,
} from "@/services/caf-memory-knowledge";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MemoryKnowledgeInput, MemoryKnowledgeResult } from "@/types/caf-memory-knowledge";

export async function requireMemoryKnowledgeUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MemoryKnowledgeInput { return body as MemoryKnowledgeInput; }
function resultFromBody(body: Record<string, unknown>): MemoryKnowledgeResult { return (body.result as MemoryKnowledgeResult | undefined) ?? runMemoryKnowledge(inputFromBody(body)); }

export function contractResponse() { return getMemoryKnowledgeBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runMemoryKnowledge(); }
export async function validateRequest(request: Request) { return validateMemoryKnowledge(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryKnowledge(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function memoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryKnowledge(); return { architecture: result.architecture, memory_objects: result.memory_objects, knowledge_index: result.knowledge_index }; }
export async function retrievalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryKnowledge(); return { retrieval: result.retrieval, replay_validation: result.replay_validation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryKnowledge(); return { governance: result.governance, lifecycle: result.lifecycle, storage: result.storage, sharing: result.sharing }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMemoryKnowledge(); return { evidence: result.evidence, observability: result.observability }; }
