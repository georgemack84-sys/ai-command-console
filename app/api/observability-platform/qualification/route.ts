import { NextResponse } from "next/server";
import { qualificationRequest, requireObservabilityPlatformUser } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await qualificationRequest(request)); }
