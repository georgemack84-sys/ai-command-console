import { NextResponse } from "next/server";
import { evidenceGovernanceRequest, requireWaveFiveWritingPublisherUser } from "../core";

export async function GET() { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await evidenceGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await evidenceGovernanceRequest(request)); }
