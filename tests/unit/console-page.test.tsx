import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { requireSessionUser } = vi.hoisted(() => ({
  requireSessionUser: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({
  requireSessionUser,
}));

import ConsolePage from "@/app/console/page";

describe("console page", () => {
  it("renders the mission intelligence console", async () => {
    requireSessionUser.mockResolvedValue({
      id: "user_1",
    });

    const element = await ConsolePage({
      searchParams: Promise.resolve({
        executionId: "mission-execution-001",
      }),
    });

    const markup = renderToStaticMarkup(element);

    expect(requireSessionUser).toHaveBeenCalled();
    expect(markup).toContain("Mission Intelligence Console");
    expect(markup).toContain("Constitutional Mission Intelligence");
  });
});
