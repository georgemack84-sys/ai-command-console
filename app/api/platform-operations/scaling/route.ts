import { NextResponse } from "next/server";
import { requirePlatformOperationsUser, scalingRequest } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await scalingRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await scalingRequest(request)); }
