import { NextResponse } from "next/server";
import { agentLifecycleRequest, requireLifecycleEngineUser } from "../core";
export async function GET() { await requireLifecycleEngineUser(); return NextResponse.json(await agentLifecycleRequest()); }
export async function POST(request: Request) { await requireLifecycleEngineUser(); return NextResponse.json(await agentLifecycleRequest(request)); }
