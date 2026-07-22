import { NextResponse } from "next/server";
import { lineageRequest, requireTrustResolutionEngineUser } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(await lineageRequest()); }
export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await lineageRequest(request)); }
