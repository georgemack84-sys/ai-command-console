import { NextResponse } from "next/server";
import { requireTrustResolutionEngineUser, standingRequest } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(await standingRequest()); }
export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await standingRequest(request)); }
