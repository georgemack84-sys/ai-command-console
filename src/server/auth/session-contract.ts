export const SESSION_COOKIE_NAME = "ai_command_console_session";

export type SessionTokenPayload = {
  sessionId: string;
  userId: string;
  expiresAt: string;
};

