import { NextResponse } from "next/server";
import { contractResponse, requireEvidenceEngineUser } from "../core";

export async function GET() { await requireEvidenceEngineUser(); return NextResponse.json(contractResponse()); }
