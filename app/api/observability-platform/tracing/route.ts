import { NextResponse } from "next/server";
import { requireObservabilityPlatformUser, tracingRequest } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(await tracingRequest()); }
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await tracingRequest(request)); }
