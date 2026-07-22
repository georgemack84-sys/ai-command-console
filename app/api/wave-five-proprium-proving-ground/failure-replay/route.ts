import { NextResponse } from "next/server";
import { failureReplayRequest, requireWaveFiveProvingGroundUser } from "../core";

export async function GET() { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await failureReplayRequest()); }
export async function POST(request: Request) { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await failureReplayRequest(request)); }
