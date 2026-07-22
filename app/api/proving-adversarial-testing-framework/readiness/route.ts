import { NextResponse } from "next/server";
import { readinessRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await readinessRequest(request)); }
