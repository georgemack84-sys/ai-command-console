import { NextResponse } from "next/server";
import { emergencyRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await emergencyRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await emergencyRequest(request)); }
