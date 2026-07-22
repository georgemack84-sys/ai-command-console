import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveResearchUser } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(contractResponse()); }
