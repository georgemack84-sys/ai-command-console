import { NextResponse } from "next/server";
import { faultInjectionRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await faultInjectionRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await faultInjectionRequest(request)); }
