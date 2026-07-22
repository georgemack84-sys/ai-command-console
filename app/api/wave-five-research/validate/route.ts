import { NextResponse } from "next/server";
import { requireWaveFiveResearchUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await validateRequest(request)); }
