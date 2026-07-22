import { NextResponse } from "next/server";
import { requireOperationalEvidenceReplayUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireOperationalEvidenceReplayUser(); return NextResponse.json(await validateRequest(request)); }
