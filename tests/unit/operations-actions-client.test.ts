import { afterEach, describe, expect, it, vi } from "vitest";
import { postOperationsAction } from "@/src/lib/client/operations-actions";

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe("operations actions client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries a confirmation-required operation only after explicit approval", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          data: {
            action: "collaboration:delete-policy-playbook",
            output: "Control review requires confirmation before execution.",
            requiresConfirmation: true,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ok: true,
          data: {
            action: "collaboration:delete-policy-playbook",
            output: "Deleted policy playbook playbook_1.",
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = await postOperationsAction("collaboration:delete-policy-playbook", { playbookId: "playbook_1" });

    expect(window.confirm).toHaveBeenCalledWith("Control review requires confirmation before execution.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(
      expect.objectContaining({ confirmed: false }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(
      expect.objectContaining({ confirmed: true }),
    );
    expect(result.output).toBe("Deleted policy playbook playbook_1.");
  });

  it("does not retry when the operator declines confirmation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ok: true,
        data: {
          action: "collaboration:delete-policy-playbook",
          output: "Control review requires confirmation before execution.",
          requiresConfirmation: true,
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    await expect(
      postOperationsAction("collaboration:delete-policy-playbook", { playbookId: "playbook_1" }),
    ).rejects.toThrow("Operation cancelled before confirmation.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
