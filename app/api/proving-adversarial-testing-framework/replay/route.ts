import { NextResponse } from "next/server";
import { replayRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await replayRequest(request)); }
