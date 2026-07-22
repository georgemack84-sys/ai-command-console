import { NextResponse } from "next/server";
import { recoveryRequest, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await recoveryRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await recoveryRequest(request)); }
