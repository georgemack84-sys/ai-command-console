import { z } from "zod";

export const supportedManualContentTypes = [
  "text/plain",
  "text/markdown",
  "text/html",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const manualIntakeSchema = z.object({
  workspaceId: z.string().min(1),
  sourceRegistryId: z.string().min(1),
  contentType: z.enum(supportedManualContentTypes),
  contentText: z.string().max(5_000_000).optional(),
  contentBase64: z.string().max(7_000_000).optional(),
  originalFilename: z.string().trim().min(1).max(255).optional(),
  originUrl: z.string().url().optional(),
}).superRefine((intake, context) => {
  if (Boolean(intake.contentText) === Boolean(intake.contentBase64)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["contentText"], message: "Provide exactly one of contentText or contentBase64." });
  }
  if (intake.contentBase64 && (!/^[A-Za-z0-9+/]*={0,2}$/.test(intake.contentBase64) || intake.contentBase64.length % 4 !== 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["contentBase64"], message: "contentBase64 must be valid base64." });
  }
});

export type ManualIntake = z.infer<typeof manualIntakeSchema>;
