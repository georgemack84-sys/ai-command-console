import { NextResponse } from "next/server";
import { requireSecurityCoreUser, verificationRequest } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await verificationRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await verificationRequest(request)); }
