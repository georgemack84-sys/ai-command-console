import { NextResponse } from "next/server";
import { encryptionRequest, requireSecurityCoreUser } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await encryptionRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await encryptionRequest(request)); }
