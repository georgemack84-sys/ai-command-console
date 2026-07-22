import { NextResponse } from "next/server";
import { requireWaveFivePersonalKnowledgeUser, reviewRequest } from "../core";

export async function GET() { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await reviewRequest()); }
export async function POST(request: Request) { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await reviewRequest(request)); }
