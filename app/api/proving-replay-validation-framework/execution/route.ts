import { NextResponse } from "next/server";
import { executionRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await executionRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await executionRequest(request)); }
