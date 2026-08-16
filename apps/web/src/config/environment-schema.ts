import { z } from 'zod';

const versionPattern = /^[0-9A-Za-z][0-9A-Za-z._+-]*$/;

const apiBaseUrlSchema = z
  .string()
  .trim()
  .min(1, 'NEXT_PUBLIC_API_BASE_URL is required.')
  .superRefine((value, context) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      context.addIssue({
        code: 'custom',
        message:
          'NEXT_PUBLIC_API_BASE_URL must be a valid absolute HTTP or HTTPS URL.',
      });
      return;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      context.addIssue({
        code: 'custom',
        message: 'NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS.',
      });
    }
    if (url.username || url.password) {
      context.addIssue({
        code: 'custom',
        message: 'NEXT_PUBLIC_API_BASE_URL must not contain credentials.',
      });
    }
    if (url.search || url.hash) {
      context.addIssue({
        code: 'custom',
        message:
          'NEXT_PUBLIC_API_BASE_URL must not contain a query string or fragment.',
      });
    }
  })
  .transform((value) => value.replace(/\/$/, ''));

const publicEnvironmentSchema = z
  .object({
    NEXT_PUBLIC_APP_NAME: z
      .string()
      .trim()
      .min(1, 'NEXT_PUBLIC_APP_NAME is required.'),
    NEXT_PUBLIC_APP_VERSION: z
      .string()
      .trim()
      .min(1, 'NEXT_PUBLIC_APP_VERSION is required.')
      .regex(
        versionPattern,
        'NEXT_PUBLIC_APP_VERSION must be a display-safe version identifier.',
      ),
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrlSchema,
    NEXT_PUBLIC_ENVIRONMENT: z.enum([
      'development',
      'test',
      'staging',
      'production',
    ]),
  })
  .strict();

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function parsePublicEnvironment(
  input: Record<string, string | undefined>,
): PublicEnvironment {
  return publicEnvironmentSchema.parse(input);
}
