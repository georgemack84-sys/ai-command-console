import { NextResponse } from "next/server";
import { governanceRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await governanceRequest(request)); }
