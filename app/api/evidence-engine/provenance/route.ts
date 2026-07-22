import { NextResponse } from "next/server";
import { provenanceRequest, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await provenanceRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await provenanceRequest(request)); }
