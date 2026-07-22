import { NextResponse } from "next/server";
import { requireMessagingFullUser, securityRequest } from "../core";
export async function GET() { await requireMessagingFullUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireMessagingFullUser(); return NextResponse.json(await securityRequest(request)); }
