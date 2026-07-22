import { NextResponse } from "next/server";
import { readinessRequest, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await readinessRequest(request)); }
