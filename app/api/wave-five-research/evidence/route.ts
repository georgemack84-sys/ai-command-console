import { NextResponse } from "next/server";
import { evidenceRequest, requireWaveFiveResearchUser } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await evidenceRequest(request)); }
