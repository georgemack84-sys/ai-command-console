import { NextResponse } from "next/server";
import { readinessRequest, requireObservabilityPlatformUser } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await readinessRequest(request)); }
