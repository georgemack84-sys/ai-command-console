import { NextResponse } from "next/server";
import { misuseRequest, requireAdversarialTestingUser } from "../core";
export async function GET() { await requireAdversarialTestingUser(); return NextResponse.json(await misuseRequest()); }
export async function POST(request: Request) { await requireAdversarialTestingUser(); return NextResponse.json(await misuseRequest(request)); }
