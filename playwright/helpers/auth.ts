import { expect, type Page } from "@playwright/test";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function hasDatabaseAccess(page: Page) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const response = await page.request.get("/api/ready", {
        timeout: 10_000,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: {
          ok?: boolean;
          status?: string;
          checks?: {
            authSecret?: { ok?: boolean };
            database?: { ok?: boolean };
          };
        };
      };
      const authReady = Boolean(payload.data?.checks?.authSecret?.ok);
      const databaseReady = Boolean(payload.data?.checks?.database?.ok);
      if (authReady && databaseReady) {
        return true;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < 12) {
      await delay(Math.min(2_000, 500 + attempt * 250));
    }
  }

  if (lastError) {
    throw lastError;
  }

  return false;
}

export async function ensureDatabaseAccess(page: Page) {
  const ready = await hasDatabaseAccess(page);
  expect(ready).toBe(true);
}

export async function loginAsShowcaseAdmin(page: Page, next = "/dashboard") {
  const targetUrl = new RegExp(`${next.replace("/", "\\/")}`);

  await page.goto(`/auth?next=${encodeURIComponent(next)}`);
  await expect(page.getByText(/sign in to access the ai command console/i)).toBeVisible();

  await page.locator('main input[type="text"]').last().fill("showcase@pulse.local");
  await page.locator('main input[type="password"]').fill("Launchpad-Admin-2026");

  const submitButton = page.locator("main").getByRole("button", { name: /^log in$/i }).last();
  await submitButton.evaluate((element) => {
    (element as HTMLButtonElement).click();
  });

  try {
    await expect(page).toHaveURL(targetUrl, { timeout: 5_000 });
  } catch {
    let response: Awaited<ReturnType<Page["request"]["post"]>> | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        response = await page.request.post("/api/auth/login", {
          data: {
            email: "showcase@pulse.local",
            password: "Launchpad-Admin-2026",
          },
          timeout: 10_000,
        });
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 4) {
          await delay(750);
        }
      }
    }

    if (!response) {
      throw lastError;
    }

    expect(response.ok()).toBeTruthy();

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        await page.goto(next, { waitUntil: "domcontentloaded" });
      } catch {
        // Allow redirected auth transitions to settle before retrying the target page.
      }

      if (targetUrl.test(page.url())) {
        break;
      }

      await delay(250 * attempt);
    }

    await expect(page).toHaveURL(targetUrl, { timeout: 5_000 });
  }
}
