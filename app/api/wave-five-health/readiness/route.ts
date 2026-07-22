import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFiveHealthUser } from "../core";

export async function GET() { await requireWaveFiveHealthUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFiveHealthUser(); return NextResponse.json(await readinessRequest(request)); }
