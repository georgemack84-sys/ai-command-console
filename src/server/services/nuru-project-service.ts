import { z } from "zod";

export const nuruProjects = ["Nuru", "Proprium", "Noesis", "Axiom", "Household Manager", "Weather CLI", "Civitas"] as const;
export const projectScopeSchema = z.object({ primaryProject: z.enum(nuruProjects), relatedProjects: z.array(z.enum(nuruProjects)).max(6).default([]) }).superRefine((scope, context) => { if (scope.relatedProjects.includes(scope.primaryProject)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["relatedProjects"], message: "Primary project cannot also be related." }); });
export type NuruProjectScope = z.infer<typeof projectScopeSchema>;

/** Deterministic project-boundary normalization; Context proposes scope, this service validates it. */
export const NuruProjectService = {
  validate: (scope: z.input<typeof projectScopeSchema>) => projectScopeSchema.safeParse(scope),
  normalize(scope: z.input<typeof projectScopeSchema>): NuruProjectScope { const parsed = projectScopeSchema.parse(scope); return { primaryProject: parsed.primaryProject, relatedProjects: [...new Set(parsed.relatedProjects)].sort() as NuruProjectScope["relatedProjects"] }; },
};
