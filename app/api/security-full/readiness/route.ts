import { NextResponse } from "next/server";
import { readinessRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await readinessRequest(request)); }
