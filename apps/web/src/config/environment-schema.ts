import { z } from 'zod';

export const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1),
  NEXT_PUBLIC_APP_VERSION: z.string().trim().min(1),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum([
    'development',
    'test',
    'staging',
    'production',
  ]),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function parsePublicEnvironment(
  input: Record<string, string | undefined>,
): PublicEnvironment {
  return publicEnvironmentSchema.parse(input);
}
