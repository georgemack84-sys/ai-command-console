import { NextResponse } from "next/server";
import { requireEvidenceEngineUser, securityRequest } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await securityRequest(request)); }
