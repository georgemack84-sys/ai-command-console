import { NextResponse } from "next/server";
import { requireWaveFivePersonalKnowledgeUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFivePersonalKnowledgeUser(); return NextResponse.json(await validateRequest(request)); }
