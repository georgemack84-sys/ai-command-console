import {
  addRecoveryOperatorNote,
  dismissRecoveryOperatorAdvisory,
  escalateRecoveryOperatorAdvisory,
  getRecoveryOperatorReadModel,
  getRecoveryOperatorTimeline,
  getRecoveryOperatorView,
  requestRecoveryOperatorVerification,
} from "../controllers/recoveryOperatorController";

function statusFor(result: { ok: boolean }) {
  return result.ok ? 200 : 409;
}

type RecoveryRouteRequest = {
  params: { executionId?: string };
  body?: Record<string, unknown>;
};

type RecoveryRouteResponse = {
  status(code: number): {
    json(payload: unknown): unknown;
  };
};

type RecoveryRouteHandler = (req: RecoveryRouteRequest, res: RecoveryRouteResponse) => Promise<unknown>;

type RecoveryRouteRouter = {
  get(path: string, handler: RecoveryRouteHandler): unknown;
  post(path: string, handler: RecoveryRouteHandler): unknown;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function registerRecoveryOperatorRoutes(router: RecoveryRouteRouter) {
  router.get("/api/recovery/:executionId/read-model", async (req, res) => {
    const result = await getRecoveryOperatorReadModel({
      executionId: String(req.params.executionId || ""),
      nowMs: optionalNumber(req.body?.nowMs),
    });
    return res.status(statusFor(result)).json(result);
  });

  router.get("/api/recovery/:executionId/timeline", async (req, res) => {
    const result = await getRecoveryOperatorTimeline({
      executionId: String(req.params.executionId || ""),
      nowMs: optionalNumber(req.body?.nowMs),
    });
    return res.status(statusFor(result)).json(result);
  });

  router.get("/api/recovery/:executionId/operator-view", async (req, res) => {
    const result = await getRecoveryOperatorView({
      executionId: String(req.params.executionId || ""),
      nowMs: optionalNumber(req.body?.nowMs),
    });
    return res.status(statusFor(result)).json(result);
  });

  router.post("/api/recovery/:executionId/operator-note", async (req, res) => {
    const result = await addRecoveryOperatorNote({
      executionId: String(req.params.executionId || ""),
      note: String(req.body?.note || ""),
      notedBy: String(req.body?.notedBy || req.body?.requestedBy || "operator"),
      nowMs: optionalNumber(req.body?.nowMs),
    });
    return res.status(statusFor(result)).json(result);
  });

  router.post("/api/recovery/:executionId/request-verification", async (req, res) => {
    const result = await requestRecoveryOperatorVerification({
      executionId: String(req.params.executionId || ""),
      requestedBy: String(req.body?.requestedBy || "operator"),
      nowMs: optionalNumber(req.body?.nowMs),
    });
    return res.status(statusFor(result)).json(result);
  });

  router.post("/api/recovery/:executionId/dismiss-advisory", async (req, res) => {
    const result = await dismissRecoveryOperatorAdvisory({
      executionId: String(req.params.executionId || ""),
      advisoryId: optionalString(req.body?.advisoryId),
      dismissedBy: String(req.body?.dismissedBy || req.body?.requestedBy || "operator"),
      reason: optionalString(req.body?.reason),
      nowMs: optionalNumber(req.body?.nowMs),
    });
    return res.status(statusFor(result)).json(result);
  });

  router.post("/api/recovery/:executionId/escalate-advisory", async (req, res) => {
    const result = await escalateRecoveryOperatorAdvisory({
      executionId: String(req.params.executionId || ""),
      advisoryId: optionalString(req.body?.advisoryId),
      escalatedBy: String(req.body?.escalatedBy || req.body?.requestedBy || "operator"),
      reason: optionalString(req.body?.reason),
      nowMs: optionalNumber(req.body?.nowMs),
    });
    return res.status(statusFor(result)).json(result);
  });

  return router;
}
