import { NextResponse } from "next/server";
import { requireDelegationEngineUser, runtimeIntegrationRequest } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await runtimeIntegrationRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await runtimeIntegrationRequest(request)); }
