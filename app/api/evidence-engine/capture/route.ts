import { NextResponse } from "next/server";
import { captureRequest, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await captureRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await captureRequest(request)); }
