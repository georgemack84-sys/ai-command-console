import { NextResponse } from "next/server";
import { approvalsRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await approvalsRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await approvalsRequest(request)); }
