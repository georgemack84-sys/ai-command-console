import { NextResponse } from "next/server";
import { evidenceGovernanceRequest, requireWaveFiveCalendarTimeUser } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await evidenceGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await evidenceGovernanceRequest(request)); }
