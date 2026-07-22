import { NextResponse } from "next/server";
import { evidenceRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await evidenceRequest(request)); }
