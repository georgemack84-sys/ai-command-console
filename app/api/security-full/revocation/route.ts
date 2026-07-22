import { NextResponse } from "next/server";
import { requireSecurityFullUser, revocationRequest } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await revocationRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await revocationRequest(request)); }
