import { NextResponse } from "next/server";
import { graphRequest, requireWaveFivePersonalKnowledgeUser } from "../core";

export async function GET() { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await graphRequest()); }
export async function POST(request: Request) { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await graphRequest(request)); }
