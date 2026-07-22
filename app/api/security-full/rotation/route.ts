import { NextResponse } from "next/server";
import { requireSecurityFullUser, rotationRequest } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await rotationRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await rotationRequest(request)); }
