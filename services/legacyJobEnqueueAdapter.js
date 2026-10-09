// eslint-disable-next-line @typescript-eslint/no-require-imports -- legacy service boundary remains CommonJS.
const { createAdmittedJobEnqueuer } = require("./jobQueue");

function createLegacyJobEnqueueAdapter(options = {}) {
  const source = String(options.source || "legacy_console").trim();
  const enqueueAdmittedJob = options.enqueueAdmittedJob || createAdmittedJobEnqueuer(source, options);

  return function enqueueLegacyJob(type, payload = {}, actor = {}) {
    const normalizedPayload = payload && typeof payload === "object" ? payload : {};
    const normalizedActor = actor && typeof actor === "object" ? actor : {};
    const actorId = String(normalizedActor.actorId || normalizedActor.id || normalizedActor.userId || "").trim();
    const workspaceId = String(
      normalizedActor.workspaceId || normalizedPayload.workspaceId || normalizedPayload.workspace || "",
    ).trim();

    return enqueueAdmittedJob(type, normalizedPayload, {
      ...normalizedActor,
      actorId,
      workspaceId,
    });
  };
}

module.exports = {
  createLegacyJobEnqueueAdapter,
};
