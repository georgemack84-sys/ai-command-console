import { NextResponse } from "next/server";
import { operationalReadinessRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await operationalReadinessRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await operationalReadinessRequest(request)); }
