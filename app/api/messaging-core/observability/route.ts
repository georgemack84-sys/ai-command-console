import { NextResponse } from "next/server";
import { observabilityRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await observabilityRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await observabilityRequest(request)); }
