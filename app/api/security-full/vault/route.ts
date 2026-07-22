import { NextResponse } from "next/server";
import { requireSecurityFullUser, vaultRequest } from "../core";
export async function GET() { await requireSecurityFullUser(); return NextResponse.json(await vaultRequest()); }
export async function POST(request: Request) { await requireSecurityFullUser(); return NextResponse.json(await vaultRequest(request)); }
