import { NextResponse } from "next/server";
import { evidenceRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await evidenceRequest(request)); }
