import { NextResponse } from "next/server";
import { evidenceRequest, requireIdentityFullUser } from "../core";
export async function GET() { await requireIdentityFullUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireIdentityFullUser(); return NextResponse.json(await evidenceRequest(request)); }
