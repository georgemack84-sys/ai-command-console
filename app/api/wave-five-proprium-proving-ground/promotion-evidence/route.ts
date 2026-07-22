import { NextResponse } from "next/server";
import { promotionEvidenceRequest, requireWaveFiveProvingGroundUser } from "../core";

export async function GET() { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await promotionEvidenceRequest()); }
export async function POST(request: Request) { await requireWaveFiveProvingGroundUser(); return NextResponse.json(await promotionEvidenceRequest(request)); }
