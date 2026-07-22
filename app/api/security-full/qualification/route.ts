import { NextResponse } from "next/server";
import { qualificationRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await qualificationRequest(request)); }
