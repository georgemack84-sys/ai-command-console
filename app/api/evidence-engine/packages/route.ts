import { NextResponse } from "next/server";
import { packagesRequest, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(await packagesRequest()); }
export async function POST(request: Request) { await requireEvidenceEngineUser(); return NextResponse.json(await packagesRequest(request)); }
