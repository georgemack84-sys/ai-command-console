import { NextResponse } from "next/server";
import { dashboardRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await dashboardRequest(request)); }
