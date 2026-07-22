import { NextResponse } from "next/server";
import { recoveryRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await recoveryRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await recoveryRequest(request)); }
