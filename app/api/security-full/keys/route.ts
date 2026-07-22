import { NextResponse } from "next/server";
import { keysRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await keysRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await keysRequest(request)); }
