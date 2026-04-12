import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthClient } from "@/src/components/auth/auth-client";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

describe("AuthClient", () => {
  it("lets the user switch from login to signup mode", () => {
    render(<AuthClient />);

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByText(/sign in to access the ai command console/i)).toBeInTheDocument();
    expect(screen.getByText(/name/i)).toBeInTheDocument();
  });
});
