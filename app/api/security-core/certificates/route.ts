import { NextResponse } from "next/server";
import { certificatesRequest, requireSecurityCoreUser } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await certificatesRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await certificatesRequest(request)); }
