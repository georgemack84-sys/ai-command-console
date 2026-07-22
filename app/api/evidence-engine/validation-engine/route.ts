import { NextResponse } from "next/server";
import { requireEvidenceEngineUser, validationEngineRequest } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await validationEngineRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await validationEngineRequest(request)); }
