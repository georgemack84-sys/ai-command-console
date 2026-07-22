import { NextResponse } from "next/server";
import { architectureRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await architectureRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await architectureRequest(request)); }
