import { NextResponse } from "next/server";
import { encryptionInTransitRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await encryptionInTransitRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await encryptionInTransitRequest(request)); }
