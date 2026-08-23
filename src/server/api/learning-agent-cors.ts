import { NextResponse } from "next/server";
import { env } from "@/src/config/env";

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin && env.LEARNING_AGENT_ORIGIN && origin === env.LEARNING_AGENT_ORIGIN ? origin : null;
}

/** Adds credentialed CORS only for the explicitly configured learning-agent origin. */
export function withLearningAgentCors(response: NextResponse, request: Request) {
  const origin = allowedOrigin(request);
  if (!origin) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Vary", "Origin");
  return response;
}

export function learningAgentPreflight(request: Request) {
  const origin = allowedOrigin(request);
  if (!origin) return new NextResponse(null, { status: 403 });
  return withLearningAgentCors(new NextResponse(null, { status: 204 }), request);
}
