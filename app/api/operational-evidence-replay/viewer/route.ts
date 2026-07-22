import { NextResponse } from "next/server";
import { requireOperationalEvidenceReplayUser, viewerRequest } from "../core";

export async function GET() { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await viewerRequest()); }
export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await viewerRequest(request)); }
