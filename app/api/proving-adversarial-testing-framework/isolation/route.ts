import { NextResponse } from "next/server";
import { isolationRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await isolationRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await isolationRequest(request)); }
