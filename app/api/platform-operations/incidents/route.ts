import { NextResponse } from "next/server";
import { incidentsRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await incidentsRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await incidentsRequest(request)); }
