import { NextResponse } from "next/server";
import { keysRequest, requireSecurityCoreUser } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await keysRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await keysRequest(request)); }
