import { NextResponse } from "next/server";
import { requireIdentityFullUser, sessionsRequest } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await sessionsRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await sessionsRequest(request)); }
