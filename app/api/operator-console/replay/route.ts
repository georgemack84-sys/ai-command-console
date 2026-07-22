import { NextResponse } from "next/server";
import { replayRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await replayRequest(request)); }
