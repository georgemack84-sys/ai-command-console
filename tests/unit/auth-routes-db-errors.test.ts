import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  authenticateUser: vi.fn(),
  createUserAccount: vi.fn(),
  deleteUserAccount: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock("@/src/server/services/invite-service", () => ({
  consumeWorkspaceInvite: vi.fn(),
  readInviteByToken: vi.fn(),
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as signupPost } from "@/app/api/auth/signup/route";
import { authenticateUser, createUserAccount } from "@/src/lib/auth";

describe("auth routes database failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns database_unavailable for login when the database cannot be reached", async () => {
    vi.mocked(authenticateUser).mockRejectedValue(new Error("Can't reach database server at `localhost:5432`"));

    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("database_unavailable");
  });

  it("returns database_unavailable for signup when the database cannot be reached", async () => {
    vi.mocked(createUserAccount).mockRejectedValue(new Error("Can't reach database server at `localhost:5432`"));

    const response = await signupPost(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
          name: "Test User",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("database_unavailable");
  });
});
