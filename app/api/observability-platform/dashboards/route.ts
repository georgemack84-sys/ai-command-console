import { NextResponse } from "next/server";
import { dashboardsRequest, requireObservabilityPlatformUser } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(await dashboardsRequest()); }
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await dashboardsRequest(request)); }
