import { NextResponse } from "next/server";
import { comparisonRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await comparisonRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await comparisonRequest(request)); }
