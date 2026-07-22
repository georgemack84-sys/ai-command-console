import { NextResponse } from "next/server";
import { readinessRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await readinessRequest(request)); }
