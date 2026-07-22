import { NextResponse } from "next/server";
import { requireWaveFiveResearchUser, sourceGovernanceRequest } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(await sourceGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await sourceGovernanceRequest(request)); }
