import { NextResponse } from "next/server";
import { evidenceSyncRequest, requireWaveFivePersonalKnowledgeUser } from "../core";

export async function GET() { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await evidenceSyncRequest()); }
export async function POST(request: Request) { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await evidenceSyncRequest(request)); }
