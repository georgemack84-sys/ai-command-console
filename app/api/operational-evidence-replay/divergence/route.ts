import { NextResponse } from "next/server";
import { divergenceRequest, requireOperationalEvidenceReplayUser } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await divergenceRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await divergenceRequest(request)); }
