import { NextResponse } from "next/server";
import { evidenceGovernanceRequest, requireWaveFiveApexUser } from "../core";

export async function GET() { await requireWaveFiveApexUser(); return NextResponse.json(await evidenceGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFiveApexUser(); return NextResponse.json(await evidenceGovernanceRequest(request)); }
