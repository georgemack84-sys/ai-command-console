import { NextResponse } from "next/server";
import { encryptionAtRestRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await encryptionAtRestRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await encryptionAtRestRequest(request)); }
