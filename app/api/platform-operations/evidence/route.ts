import { NextResponse } from "next/server";
import { evidenceRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await evidenceRequest(request)); }
