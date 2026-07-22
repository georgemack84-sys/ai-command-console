import { NextResponse } from "next/server";
import { evidenceRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await evidenceRequest(request)); }
