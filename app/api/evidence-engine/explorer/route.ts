import { NextResponse } from "next/server";
import { explorerRequest, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await explorerRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await explorerRequest(request)); }
