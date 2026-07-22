import { NextResponse } from "next/server";
import { certificatesRequest, requireSecurityFullUser } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await certificatesRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await certificatesRequest(request)); }
