import { NextResponse } from "next/server";
import { auditRequest, requireMessagingCoreUser } from "../core";
export async function GET() { await requireMessagingCoreUser(); return NextResponse.json(await auditRequest()); }
export async function POST(request: Request) { await requireMessagingCoreUser(); return NextResponse.json(await auditRequest(request)); }
