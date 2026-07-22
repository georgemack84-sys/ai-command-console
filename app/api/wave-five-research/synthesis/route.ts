import { NextResponse } from "next/server";
import { requireWaveFiveResearchUser, synthesisRequest } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(await synthesisRequest()); }
export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await synthesisRequest(request)); }
