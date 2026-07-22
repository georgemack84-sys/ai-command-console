import { NextResponse } from "next/server";
import { escalationRequest, requireTrustResolutionEngineUser } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(await escalationRequest()); }
export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await escalationRequest(request)); }
