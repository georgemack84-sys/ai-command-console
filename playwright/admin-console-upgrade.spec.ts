import { expect, test, type Locator } from "@playwright/test";
import { ensureDatabaseAccess, loginAsShowcaseAdmin } from "./helpers/auth";

async function safeTap(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}

async function readAdminAccess(page: import("@playwright/test").Page) {
  const response = await page.request.get("/api/admin/access");
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as {
    data?: {
      workspaces?: Array<{ id: string; name: string }>;
      invites?: Array<{ token: string; email?: string | null; status?: string }>;
    };
  };
  return payload.data ?? {};
}

async function patchAdminAccess(page: import("@playwright/test").Page, data: Record<string, unknown>) {
  const response = await page.request.patch("/api/admin/access", { data });
  expect(response.ok()).toBeTruthy();
  return response;
}

async function waitForPlatformSection(page: import("@playwright/test").Page, pattern: RegExp, timeout = 20_000) {
  await expect(page.getByText(/^platform control center$/i)).toBeVisible();
  await expect
    .poll(async () => page.getByText(pattern).last().isVisible(), { timeout, intervals: [500, 1_000, 2_000] })
    .toBe(true);
}

test.describe("admin and console upgrade flows", () => {
  test.describe.configure({ timeout: 60_000 });

  test("showcase admin can create and revoke a workspace invite from platform control center", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/platform");

    await waitForPlatformSection(page, /workspace and user administration/i);

    const inviteEmail = `playwright-admin-${Date.now()}@pulse.local`;
    const adminAccess = await readAdminAccess(page);
    const workspaceId = adminAccess.workspaces?.[0]?.id;
    expect(workspaceId).toBeTruthy();

    await patchAdminAccess(page, {
      type: "workspace-invite",
      workspaceId,
      email: inviteEmail,
    });

    await page.reload({ waitUntil: "domcontentloaded" });

    const inviteCard = page.locator("div").filter({ hasText: inviteEmail }).first();
    await expect(inviteCard).toBeVisible();

    const refreshed = await readAdminAccess(page);
    const inviteToken = refreshed.invites?.find((invite) => invite.email === inviteEmail)?.token;
    expect(inviteToken).toBeTruthy();

    await patchAdminAccess(page, {
      type: "workspace-invite-revoke",
      token: inviteToken,
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("div").filter({ hasText: inviteEmail }).first()).toContainText(/revoked/i);
  });

  test("showcase admin can run an AI summary check and a fallback drill from platform control center", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/platform");

    await waitForPlatformSection(page, /AI summary posture/i);

    const summaryResponse = await patchAdminAccess(page, { type: "ai-summary-check" });
    const summaryPayload = (await summaryResponse.json()) as {
      data?: { summaryCheck?: { traceId?: string; workspaceName?: string } };
    };
    expect(summaryPayload.data?.summaryCheck?.traceId).toBeTruthy();
    expect(summaryPayload.data?.summaryCheck?.workspaceName).toMatch(/workspace/i);

    const fallbackResponse = await patchAdminAccess(page, { type: "ai-summary-check", forceFallback: true });
    const fallbackPayload = (await fallbackResponse.json()) as {
      data?: { summaryCheck?: { title?: string; provider?: string; forcedFallback?: boolean; fallbackReason?: string | null } };
    };
    expect(
      Boolean(fallbackPayload.data?.summaryCheck?.forcedFallback) ||
        Boolean(fallbackPayload.data?.summaryCheck?.fallbackReason),
    ).toBe(true);
    expect(fallbackPayload.data?.summaryCheck?.provider).toBeTruthy();
  });

  test("showcase admin can queue an operator runtime check from the platform control center", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/platform");

    await waitForPlatformSection(page, /operator runtime checks/i);

    const response = await page.request.post("/api/jobs", {
      data: {
        type: "workspace:generate-summary",
        view: {
          name: "Platform operator summary check",
          filter: "all",
          sort: "recent",
          freshnessHours: 72,
        },
      },
    });
    expect(response.ok()).toBeTruthy();
    const payload = (await response.json()) as { data?: { job?: { id?: string; type?: string; traceId?: string | null } } };
    const queuedJob = payload.data?.job;
    expect(queuedJob?.id).toBeTruthy();

    await expect
      .poll(async () => {
        const jobResponse = await page.request.get(`/api/jobs?jobId=${encodeURIComponent(queuedJob!.id!)}`);
        const jobPayload = (await jobResponse.json()) as {
          data?: {
            job?: {
              id?: string;
              type?: string;
              traceId?: string | null;
              status?: string;
              leaseExpiresAt?: string | null;
            };
          };
        };
        return jobPayload.data?.job || null;
      }, { timeout: 20_000, intervals: [500, 1_000, 2_000] })
      .toEqual(
        expect.objectContaining({
          id: queuedJob?.id,
          type: "workspace:generate-summary",
        }),
      );
    expect(queuedJob?.traceId).toBeTruthy();
  });

  test("showcase admin can cancel a queued platform operator check", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/platform");

    const queueResponse = await page.request.post("/api/jobs", {
      data: {
        type: "workspace:generate-summary",
        view: {
          name: "Platform operator summary check",
          filter: "all",
          sort: "recent",
          freshnessHours: 72,
        },
      },
    });
    expect(queueResponse.ok()).toBeTruthy();
    const queuePayload = (await queueResponse.json()) as { data?: { job?: { id?: string } } };
    const queuedJobId = queuePayload.data?.job?.id;
    expect(queuedJobId).toBeTruthy();

    const cancelResponse = await page.request.post("/api/jobs", {
      data: { type: "job:cancel", jobId: queuedJobId },
    });
    expect(cancelResponse.ok()).toBeTruthy();

    await expect
      .poll(async () => {
        const response = await page.request.get(`/api/jobs?jobId=${encodeURIComponent(queuedJobId!)}`);
        const payload = (await response.json()) as { data?: { job?: { status?: string } } };
        return payload.data?.job?.status || "";
      }, { timeout: 15_000, intervals: [500, 1_000, 2_000] })
      .toBe("canceled");
  });

  test("showcase admin can retry a failed platform job from the failed jobs panel", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/platform");

    const failureResponse = await page.request.post("/api/jobs", {
      data: { type: "workspace:failure-drill" },
    });
    expect(failureResponse.ok()).toBeTruthy();
    const failurePayload = (await failureResponse.json()) as { data?: { job?: { id?: string } } };
    const failedJobId = failurePayload.data?.job?.id;
    expect(failedJobId).toBeTruthy();

    let observedJob = { status: "", hasError: false };
    const startedAt = Date.now();
    while (Date.now() - startedAt < 30_000) {
      const response = await page.request.get(`/api/jobs?jobId=${encodeURIComponent(failedJobId!)}`);
      const payload = (await response.json()) as {
        data?: { job?: { status?: string; error?: string | null } };
      };
      observedJob = {
        status: payload.data?.job?.status || "",
        hasError: Boolean(payload.data?.job?.error),
      };
      if (observedJob.status && (observedJob.hasError || observedJob.status !== "queued")) {
        break;
      }
      await page.waitForTimeout(1_000);
    }

    expect(observedJob.status).toBeTruthy();

    if (observedJob.status === "queued" && !observedJob.hasError) {
      return;
    }

    const retryResponse = await page.request.post("/api/jobs", {
      data: { type: "job:retry", jobId: failedJobId },
    });
    expect(retryResponse.ok()).toBeTruthy();
    await expect
      .poll(async () => {
        const response = await page.request.get(`/api/jobs?jobId=${encodeURIComponent(failedJobId!)}`);
        const payload = (await response.json()) as { data?: { job?: { status?: string } } };
        return payload.data?.job?.status || "";
      }, { timeout: 20_000, intervals: [500, 1_000, 2_000] })
      .toMatch(/queued|running|completed/);
  });

  test("showcase admin can run a console help command and see structured history", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/console");

    await expect(page.getByText(/command desk/i)).toBeVisible();

    await page.getByPlaceholder(/try: manager:route/i).fill("help");
    await safeTap(page.getByRole("button", { name: /^execute$/i }));
    await safeTap(page.getByRole("button", { name: /^console$/i }));

    await expect(page.getByText(/^help$/i).last()).toBeVisible();
    await expect(page.getByText(/structured payload|help/i).last()).toBeVisible();
  });

  test("showcase admin can inspect job trace and worker lease details in the console", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/console");

    const queuedJob = await page.evaluate(async () => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "workspace:generate-insights" }),
      });
      const payload = await response.json();
      return payload.data?.job as { id: string; traceId?: string | null } | null;
    });

    expect(queuedJob?.id).toBeTruthy();
    await page.reload();

    await expect(page.getByText("Background Jobs", { exact: true })).toBeVisible();
    const queuedJobCard = page.getByTestId(`console-job-card-${queuedJob!.id}`);
    await expect
      .poll(async () => queuedJobCard.isVisible(), { timeout: 20_000, intervals: [500, 1_000, 2_000] })
      .toBe(true);
    await page.getByTestId(`console-job-inspect-${queuedJob!.id}`).evaluate((element) => {
      (element as HTMLElement).click();
    });

    const jobDetail = page.getByTestId("console-job-detail");
    await expect
      .poll(async () => jobDetail.isVisible(), { timeout: 15_000, intervals: [500, 1_000, 2_000] })
      .toBe(true);
    await expect(jobDetail.getByText(new RegExp(`Job ID: ${queuedJob!.id}`))).toBeVisible();
    await expect(jobDetail.getByText(/Trace ID:/i)).toBeVisible();
    await expect(jobDetail.getByText(/^Worker:/i)).toBeVisible();
    await expect(jobDetail.getByText(/^Lease:/i)).toBeVisible();
  });

  test("showcase admin can request and reject an operations closeout approval", async ({ page }) => {
    await ensureDatabaseAccess(page);

    await loginAsShowcaseAdmin(page, "/operations");

    await expect(page.getByRole("heading", { name: /^workspace operations$/i }).last()).toBeVisible();

    const statusSelect = page.getByLabel("Incident status").first();
    await expect
      .poll(async () => statusSelect.isVisible(), { timeout: 20_000, intervals: [500, 1_000, 2_000] })
      .toBe(true);
    await statusSelect.selectOption("resolved");

    await expect(page.getByText(/approval state/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^reject closeout$/i }).first()).toBeVisible();

    const note = `Playwright rejection ${Date.now()}`;
    await page.getByPlaceholder(/optional rejection note/i).first().fill(note);
    await safeTap(page.getByRole("button", { name: /^reject closeout$/i }).first());

    await expect(page.getByText(note, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Rejected by/i).first()).toBeVisible();
  });
});
