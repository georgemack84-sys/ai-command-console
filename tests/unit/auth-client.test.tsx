import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthClient } from "@/src/components/auth/auth-client";

const push = vi.fn();
const refresh = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    json: async () => ({
      ok: true,
      data: {
        ok: true,
        checks: {
          database: {
            ok: true,
            details: null,
          },
        },
      },
    }),
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AuthClient", () => {
  it("lets the user switch from login to signup mode", () => {
    render(<AuthClient />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByText(/sign in to access the ai command console/i)).toBeInTheDocument();
    expect(screen.getByText(/name/i)).toBeInTheDocument();
  });

  it("keeps auth enabled when readiness only has non-database warnings", async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        data: {
          ok: false,
          status: "ready_with_warnings",
          checks: {
            database: {
              ok: true,
              details: null,
            },
          },
        },
      }),
    });

    render(<AuthClient />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /^log in$/i }).at(-1)).not.toBeDisabled();
    });

    expect(screen.queryByText(/local database is unavailable/i)).not.toBeInTheDocument();
  });

  it("submits login through the form action", async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            ok: true,
            checks: {
              database: {
                ok: true,
                details: null,
              },
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            user: {
              id: "user-1",
            },
          },
        }),
      });

    render(<AuthClient />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "operator@pulse.local" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "demo-password" },
    });
    fireEvent.submit(screen.getAllByRole("button", { name: /^log in$/i }).at(-1)!.closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "",
            email: "operator@pulse.local",
            password: "demo-password",
            inviteToken: "",
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("signs in with the local demo account shortcut", async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({
          ok: true,
          data: {
            ok: true,
            checks: {
              database: {
                ok: true,
                details: null,
              },
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            user: {
              id: "user-1",
            },
          },
        }),
      });

    render(<AuthClient />);

    fireEvent.click(screen.getByRole("button", { name: /use local demo account/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/dev-login", { method: "POST" });
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });
});
