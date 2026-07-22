import { NextResponse } from "next/server";
import { readinessRequest, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await readinessRequest(request)); }
