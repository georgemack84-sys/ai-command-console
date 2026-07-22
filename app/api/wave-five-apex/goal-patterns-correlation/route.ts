import { NextResponse } from "next/server";
import { goalPatternsCorrelationRequest, requireWaveFiveApexUser } from "../core";

export async function GET() { await requireWaveFiveApexUser(); return NextResponse.json(await goalPatternsCorrelationRequest()); }
export async function POST(request: Request) { await requireWaveFiveApexUser(); return NextResponse.json(await goalPatternsCorrelationRequest(request)); }
