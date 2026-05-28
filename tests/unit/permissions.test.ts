import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    workspaceMember: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/src/server/db/prisma";
import { requireWorkspaceRole, roleMeetsRequirement } from "@/src/server/auth/permissions";
import { AppError } from "@/src/server/api/errors";

describe("permissions", () => {
  it("role ranking accepts higher roles", () => {
    expect(roleMeetsRequirement("owner", "admin")).toBe(true);
    expect(roleMeetsRequirement("viewer", "member")).toBe(false);
  });

  it("requireWorkspaceRole throws when role is insufficient", async () => {
    vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
      role: "viewer",
    } as never);

    await expect(
      requireWorkspaceRole({ userId: "user", userRole: "operator", workspaceId: "workspace" }, "member"),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("requireWorkspaceRole allows admin without membership lookup", async () => {
    const result = await requireWorkspaceRole({ userId: "user", userRole: "admin", workspaceId: "workspace" }, "owner");
    expect(result.role).toBe("admin");
  });
});
