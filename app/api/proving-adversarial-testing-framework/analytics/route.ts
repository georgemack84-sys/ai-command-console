import { NextResponse } from "next/server";
import { analyticsRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await analyticsRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await analyticsRequest(request)); }
