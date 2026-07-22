import { NextResponse } from "next/server";
import { requireSecurityCoreUser, signingRequest } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await signingRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await signingRequest(request)); }
