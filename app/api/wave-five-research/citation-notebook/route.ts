import { NextResponse } from "next/server";
import { citationNotebookRequest, requireWaveFiveResearchUser } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(await citationNotebookRequest()); }
export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await citationNotebookRequest(request)); }
