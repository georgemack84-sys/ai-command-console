import { NextResponse } from "next/server";
import { dashboardRequest, requireOperatorConsoleUser } from "../core";

export async function GET() { await requireOperatorConsoleUser(); return NextResponse.json(await dashboardRequest()); }
export async function POST(request: Request) { await requireOperatorConsoleUser(); return NextResponse.json(await dashboardRequest(request)); }
