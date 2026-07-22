import { NextResponse } from "next/server";
import { requireEvidenceEngineUser, runtimeIntegrationRequest } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await runtimeIntegrationRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await runtimeIntegrationRequest(request)); }
