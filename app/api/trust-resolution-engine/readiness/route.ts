import { NextResponse } from "next/server";
import { readinessRequest, requireTrustResolutionEngineUser } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await readinessRequest(request)); }
