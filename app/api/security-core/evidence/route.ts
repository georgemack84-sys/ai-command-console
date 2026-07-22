import { NextResponse } from "next/server";
import { evidenceRequest, requireSecurityCoreUser } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await evidenceRequest(request)); }
