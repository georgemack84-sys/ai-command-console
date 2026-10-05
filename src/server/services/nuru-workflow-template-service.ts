import { z } from "zod";

export const workflowTemplateIdSchema = z.enum(["FAST_PATH", "STANDARD_PATH", "CONFLICT_PATH", "HIGH_AUTHORITY_PATH"]);
export type WorkflowTemplateId = z.infer<typeof workflowTemplateIdSchema>;
export const workflowTemplateSchema = z.object({ id: workflowTemplateIdSchema, stages: z.array(z.string()).min(2), requiresHumanReview: z.boolean(), archiveEligible: z.boolean(), reason: z.string() });
export type WorkflowTemplate = z.infer<typeof workflowTemplateSchema>;

export const nuruWorkflowTemplates: Record<WorkflowTemplateId, WorkflowTemplate> = {
  FAST_PATH: { id: "FAST_PATH", stages: ["DISCOVERY", "CONTEXT", "CURATOR"], requiresHumanReview: true, archiveEligible: false, reason: "Low-risk classification uses bounded discovery and context." },
  STANDARD_PATH: { id: "STANDARD_PATH", stages: ["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY", "CURATOR"], requiresHumanReview: true, archiveEligible: false, reason: "Material requiring relationship and quality evidence uses the full specialist workflow." },
  CONFLICT_PATH: { id: "CONFLICT_PATH", stages: ["DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY", "CONFLICT_ANALYSIS", "CURATOR", "HUMAN_REVIEW"], requiresHumanReview: true, archiveEligible: false, reason: "Potentially competing claims require deterministic conflict analysis and human review." },
  HIGH_AUTHORITY_PATH: { id: "HIGH_AUTHORITY_PATH", stages: ["OWNER_DECISION", "CONTEXT", "CONNECTION", "QUALITY", "CURATOR", "GOVERNANCE_GATE", "ARCHIVE"], requiresHumanReview: true, archiveEligible: true, reason: "Owner-originated material receives full assessment, but archive remains a governed action." },
};

const selectionInputSchema = z.object({ sourceAuthority: z.enum(["LOW", "MODERATE", "HIGH", "OWNER"]), content: z.string().min(1), contentLength: z.number().int().nonnegative() });

/** Deterministic path selection; the Curator cannot select a more permissive template for itself. */
export const NuruWorkflowTemplateService = {
  select(rawInput: z.input<typeof selectionInputSchema>): WorkflowTemplate {
    const input = selectionInputSchema.parse(rawInput);
    if (/\b(conflict|contradict\w*|supersed\w*|replace\w*)\b/i.test(input.content)) return nuruWorkflowTemplates.CONFLICT_PATH;
    if (input.sourceAuthority === "OWNER") return nuruWorkflowTemplates.HIGH_AUTHORITY_PATH;
    if (input.contentLength > 800 || /\b(permission|governance)\b/i.test(input.content)) return nuruWorkflowTemplates.STANDARD_PATH;
    return nuruWorkflowTemplates.FAST_PATH;
  },
};
