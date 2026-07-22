import { NextResponse } from "next/server";
import { evidenceGovernanceRequest, requireWaveFiveHealthUser } from "../core";

export async function GET() { await requireWaveFiveHealthUser(); return NextResponse.json(await evidenceGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFiveHealthUser(); return NextResponse.json(await evidenceGovernanceRequest(request)); }
