import { expect, test } from "@playwright/test";
import { ensureDatabaseAccess, loginAsShowcaseAdmin } from "./helpers/auth";

async function safeTap(locator: import("@playwright/test").Locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });
}

test("showcase admin can complete a longer operator session across research, platform, and console", async ({ page }) => {
  test.setTimeout(120_000);
  await ensureDatabaseAccess(page);
  await loginAsShowcaseAdmin(page, "/briefs");

  const briefTitle = `Playwright operator session ${Date.now()}`;
  const createdBrief = await page.evaluate(async ({ title }) => {
    const response = await fetch("/api/research/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        question: "What operator-facing signals need escalation today?",
        assignedAgent: "researcher",
        priority: "medium",
        tags: ["playwright", "operator-session"],
        summary: "Created from the longer operator session upgrade test.",
        queueBrief: false,
        status: "draft",
      }),
    });
    const payload = await response.json();
    return payload.data?.brief as { id: string; title: string } | null;
  }, { title: briefTitle });

  expect(createdBrief?.id).toBeTruthy();
  await page.goto("/briefs", { waitUntil: "domcontentloaded" });

  const briefCard = page.locator("article").filter({ hasText: briefTitle }).first();
  await expect(briefCard).toBeVisible();
  await safeTap(briefCard.getByRole("button", { name: /^route to queue$/i }));
  await expect
    .poll(async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      return page.locator("article").filter({ hasText: briefTitle }).first().textContent();
    }, { timeout: 15_000, intervals: [500, 1_000, 2_000] })
    .toMatch(/queued|Task task_/i);

  const reportTitle = `Session memo ${Date.now()}`;
  await page.goto("/reports", { waitUntil: "domcontentloaded" });
  const createReportResponse = await page.request.post("/api/research/reports", {
    data: {
      briefId: createdBrief!.id,
      title: reportTitle,
      format: "memo",
      status: "draft",
      excerpt: "This memo captures the strongest signals from the operator session.",
      keyFindings: ["Escalation paths are working.", "Platform diagnostics are healthy."],
    },
  });
  expect(createReportResponse.ok()).toBeTruthy();
  const createdReportPayload = (await createReportResponse.json()) as {
    data?: { report?: { id?: string; title?: string } };
  };
  const createdReportId = createdReportPayload.data?.report?.id;
  expect(createdReportId).toBeTruthy();

  await expect
    .poll(async () => {
      const response = await page.context().request.get("http://localhost:5050/api/research/reports");
      const payload = (await response.json()) as { data?: { reports?: Array<{ id?: string; title?: string }> } };
      return payload.data?.reports?.some((report) => report.id === createdReportId || report.title === reportTitle) ?? false;
    }, { timeout: 15_000, intervals: [500, 1_000, 2_000] })
    .toBe(true);
  const publishReportResponse = await page.context().request.patch("http://localhost:5050/api/research/reports", {
    data: {
      id: createdReportId,
      status: "published",
    },
  });
  expect(publishReportResponse.ok()).toBeTruthy();
  await expect
    .poll(async () => {
      const response = await page.context().request.get("http://localhost:5050/api/research/reports");
      const payload = (await response.json()) as {
        data?: { reports?: Array<{ id?: string; title?: string; status?: string }> };
      };
      const report = payload.data?.reports?.find((item) => item.id === createdReportId || item.title === reportTitle);
      return report?.status || "";
    }, { timeout: 15_000, intervals: [500, 1_000, 2_000] })
    .toBe("published");

  await page.goto("/platform", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/^platform control center$/i)).toBeVisible();
  await expect
    .poll(async () => page.getByTestId("platform-run-summary-check").isVisible(), { timeout: 20_000, intervals: [500, 1_000, 2_000] })
    .toBe(true);
  const summaryCheckResponse = await page.context().request.patch("http://localhost:5050/api/admin/access", {
    data: { type: "ai-summary-check" },
  });
  expect(summaryCheckResponse.ok()).toBeTruthy();
  const summaryCheckPayload = (await summaryCheckResponse.json()) as {
    data?: { summaryCheck?: { traceId?: string; workspaceName?: string } };
  };
  expect(summaryCheckPayload.data?.summaryCheck?.traceId).toBeTruthy();
  await expect(page.getByText(/worker status and recovery/i)).toBeVisible();
  await expect(page.getByText(/evaluation quality/i)).toBeVisible();

  await page.goto("/console", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/command desk/i)).toBeVisible();
  await page.getByPlaceholder(/try: manager:route/i).fill("help");
  await safeTap(page.getByRole("button", { name: /^execute$/i }));
  await safeTap(page.getByRole("button", { name: /^console$/i }));
  await expect(page.getByText(/^help$/i).last()).toBeVisible();
});
