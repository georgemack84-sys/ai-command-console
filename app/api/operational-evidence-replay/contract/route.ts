import { NextResponse } from "next/server";
import { contractResponse, requireOperationalEvidenceReplayUser } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(contractResponse()); }
