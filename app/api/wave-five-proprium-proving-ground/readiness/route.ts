import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFiveProvingGroundUser } from "../core";

export async function GET() { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await readinessRequest(request)); }
