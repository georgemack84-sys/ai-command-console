import { NextResponse } from "next/server";
import { abuseRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await abuseRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await abuseRequest(request)); }
