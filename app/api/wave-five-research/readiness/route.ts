import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFiveResearchUser } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await readinessRequest(request)); }
