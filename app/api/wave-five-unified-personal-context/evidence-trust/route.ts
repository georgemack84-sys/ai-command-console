import { NextResponse } from "next/server";
import { evidenceTrustRequest, requireWaveFiveUnifiedPersonalContextUser } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await evidenceTrustRequest()); }
export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await evidenceTrustRequest(request)); }
