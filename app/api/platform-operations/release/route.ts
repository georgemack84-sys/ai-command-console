import { NextResponse } from "next/server";
import { releaseRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await releaseRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await releaseRequest(request)); }
