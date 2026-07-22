import { NextResponse } from "next/server";
import { contractResponse, requireWaveFivePersonalKnowledgeUser } from "../core";

export async function GET() { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(contractResponse()); }
