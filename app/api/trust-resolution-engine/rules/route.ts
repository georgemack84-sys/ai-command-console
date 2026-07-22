import { NextResponse } from "next/server";
import { requireTrustResolutionEngineUser, rulesRequest } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(await rulesRequest()); }
export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await rulesRequest(request)); }
