import { NextResponse } from "next/server";
import { qualificationRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await qualificationRequest(request)); }
