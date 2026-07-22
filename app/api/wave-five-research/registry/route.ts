import { NextResponse } from "next/server";
import { registryRequest, requireWaveFiveResearchUser } from "../core";

export async function GET() { await requireWaveFiveResearchUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireWaveFiveResearchUser(); return NextResponse.json(await registryRequest(request)); }
