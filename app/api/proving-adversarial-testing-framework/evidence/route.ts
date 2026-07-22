import { NextResponse } from "next/server";
import { evidenceRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await evidenceRequest(request)); }
