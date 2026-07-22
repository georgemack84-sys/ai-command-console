import { NextResponse } from "next/server";
import { requirePlatformOperationsUser, rollbackRequest } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await rollbackRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await rollbackRequest(request)); }
