import { NextResponse } from "next/server";
import { requireWaveFiveUnifiedPersonalContextUser, resolutionRequest } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await resolutionRequest()); }
export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await resolutionRequest(request)); }
