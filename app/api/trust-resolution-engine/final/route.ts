import { NextResponse } from "next/server";
import { finalRequest, requireTrustResolutionEngineUser } from "../core";

export async function GET() { await requireTrustResolutionEngineUser(); return NextResponse.json(await finalRequest()); }
export async function POST(request: Request) { await requireTrustResolutionEngineUser(); return NextResponse.json(await finalRequest(request)); }
