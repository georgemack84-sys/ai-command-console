import { NextResponse } from "next/server";
import { alertingRequest, requireObservabilityPlatformUser } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(await alertingRequest()); }
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await alertingRequest(request)); }
