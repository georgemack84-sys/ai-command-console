import { NextResponse } from "next/server";
import { apisRequest, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await apisRequest(request)); }
