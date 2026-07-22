import { NextResponse } from "next/server";
import { registryRequest, requireWaveFivePersonalKnowledgeUser } from "../core";

export async function GET() { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await registryRequest(request)); }
