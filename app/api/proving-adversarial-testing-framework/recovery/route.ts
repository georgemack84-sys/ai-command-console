import { NextResponse } from "next/server";
import { recoveryRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await recoveryRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await recoveryRequest(request)); }
