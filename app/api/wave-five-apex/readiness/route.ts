import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFiveApexUser } from "../core";

export async function GET() { await requireWaveFiveApexUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFiveApexUser(); return NextResponse.json(await readinessRequest(request)); }
