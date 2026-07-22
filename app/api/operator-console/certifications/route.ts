import { NextResponse } from "next/server";
import { certificationsRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await certificationsRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await certificationsRequest(request)); }
