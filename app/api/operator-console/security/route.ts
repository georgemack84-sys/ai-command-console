import { NextResponse } from "next/server";
import { requireOperatorConsoleUser, securityRequest } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await securityRequest(request)); }
