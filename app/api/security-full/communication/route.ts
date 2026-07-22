import { NextResponse } from "next/server";
import { communicationRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await communicationRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await communicationRequest(request)); }
