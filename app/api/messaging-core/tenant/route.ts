import { NextResponse } from "next/server";
import { requireMessagingCoreUser, tenantRequest } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await tenantRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await tenantRequest(request)); }
