import { NextResponse } from "next/server";
import { requireOperationalEvidenceReplayUser, securityRequest } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await securityRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await securityRequest(request)); }
