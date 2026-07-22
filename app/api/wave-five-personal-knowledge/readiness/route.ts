import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFivePersonalKnowledgeUser } from "../core";

export async function GET() { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await readinessRequest(request)); }
