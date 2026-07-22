import { NextResponse } from "next/server";
import { requireMessagingCoreUser, securityRequest } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await securityRequest(request)); }
