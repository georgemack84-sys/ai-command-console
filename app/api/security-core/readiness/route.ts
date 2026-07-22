import { NextResponse } from "next/server";
import { readinessRequest, requireSecurityCoreUser } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await readinessRequest(request)); }
