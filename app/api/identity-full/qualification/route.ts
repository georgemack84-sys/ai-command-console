import { NextResponse } from "next/server";
import { qualificationRequest, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await qualificationRequest(request)); }
