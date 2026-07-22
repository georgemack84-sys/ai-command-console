import { NextResponse } from "next/server";
import { consoleRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await consoleRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await consoleRequest(request)); }
