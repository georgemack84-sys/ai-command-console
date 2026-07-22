import { NextResponse } from "next/server";
import { requireTrustResolutionEngineUser, restrictionsRequest } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(await restrictionsRequest()); }
export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await restrictionsRequest(request)); }
