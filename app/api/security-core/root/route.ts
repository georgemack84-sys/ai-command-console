import { NextResponse } from "next/server";
import { requireSecurityCoreUser, rootRequest } from "../core";
export async function GET() { await requireSecurityCoreUser(); return NextResponse.json(await rootRequest()); }
export async function POST(request: Request) { await requireSecurityCoreUser(); return NextResponse.json(await rootRequest(request)); }
