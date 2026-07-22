import { NextResponse } from "next/server";
import { inputsRequest, requireReplayValidationUser } from "../core";
export async function GET() { await requireReplayValidationUser(); return NextResponse.json(await inputsRequest()); }
export async function POST(request: Request) { await requireReplayValidationUser(); return NextResponse.json(await inputsRequest(request)); }
