import { NextResponse } from "next/server";
import { explainabilityRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await explainabilityRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await explainabilityRequest(request)); }
