import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFiveUnifiedPersonalContextUser } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await readinessRequest(request)); }
