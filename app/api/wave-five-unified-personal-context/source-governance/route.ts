import { NextResponse } from "next/server";
import { requireWaveFiveUnifiedPersonalContextUser, sourceGovernanceRequest } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await sourceGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await sourceGovernanceRequest(request)); }
