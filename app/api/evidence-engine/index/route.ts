import { NextResponse } from "next/server";
import { indexRequest, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await indexRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await indexRequest(request)); }
