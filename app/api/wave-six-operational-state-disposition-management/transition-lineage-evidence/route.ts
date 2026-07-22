import { NextResponse } from "next/server";
import { requireWaveSixOperationalStateDispositionManagementUser, transitionLineageEvidenceRequest } from "../core";

export async function GET() { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await transitionLineageEvidenceRequest()); }
export async function POST(request: Request) { await requireWaveSixOperationalStateDispositionManagementUser(); return NextResponse.json(await transitionLineageEvidenceRequest(request)); }
