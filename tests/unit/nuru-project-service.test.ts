import { describe, expect, it } from "vitest";
import { NuruProjectService } from "@/src/server/services/nuru-project-service";

describe("Nuru project awareness", () => {
  it("keeps one primary project and distinct related projects", () => {
    expect(NuruProjectService.normalize({ primaryProject: "Nuru", relatedProjects: ["Noesis", "Civitas", "Noesis"] })).toEqual({ primaryProject: "Nuru", relatedProjects: ["Civitas", "Noesis"] });
    expect(NuruProjectService.validate({ primaryProject: "Nuru", relatedProjects: ["Nuru"] }).success).toBe(false);
  });
});
