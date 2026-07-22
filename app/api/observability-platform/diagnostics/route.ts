import { NextResponse } from "next/server";
import { diagnosticsRequest, requireObservabilityPlatformUser } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(await diagnosticsRequest()); }
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await diagnosticsRequest(request)); }
