import { NextResponse } from "next/server";
import { loggingRequest, requireObservabilityPlatformUser } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(await loggingRequest()); }
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await loggingRequest(request)); }
