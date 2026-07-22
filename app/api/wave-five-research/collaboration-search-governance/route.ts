import { NextResponse } from "next/server";
import { collaborationSearchGovernanceRequest, requireWaveFiveResearchUser } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(await collaborationSearchGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await collaborationSearchGovernanceRequest(request)); }
