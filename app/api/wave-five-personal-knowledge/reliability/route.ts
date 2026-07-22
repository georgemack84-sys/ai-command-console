import { NextResponse } from "next/server";
import { reliabilityRequest, requireWaveFivePersonalKnowledgeUser } from "../core";

export async function GET() { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await reliabilityRequest()); }
export async function POST(request: Request) { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await reliabilityRequest(request)); }
