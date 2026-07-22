import { NextResponse } from "next/server";
import { requireWaveFiveProvingGroundUser, syntheticSimulationRequest } from "../core";

export async function GET() { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await syntheticSimulationRequest()); }
export async function POST(request: Request) { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await syntheticSimulationRequest(request)); }
