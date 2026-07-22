import { NextResponse } from "next/server";
import { readinessRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await readinessRequest(request)); }
