import { NextResponse } from "next/server";
import { governanceRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await governanceRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await governanceRequest(request)); }
