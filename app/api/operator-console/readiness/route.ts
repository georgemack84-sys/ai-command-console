import { NextResponse } from "next/server";
import { readinessRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await readinessRequest(request)); }
