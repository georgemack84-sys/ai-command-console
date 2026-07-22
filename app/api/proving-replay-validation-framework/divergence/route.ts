import { NextResponse } from "next/server";
import { divergenceRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await divergenceRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await divergenceRequest(request)); }
