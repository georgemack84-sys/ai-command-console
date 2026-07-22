import { NextResponse } from "next/server";
import { recommendationsRequest, requireWaveFiveHealthUser } from "../core";

export async function GET() { await requireWaveFiveHealthUser(); return NextResponse.json(await recommendationsRequest()); }
export async function POST(request: Request) { await requireWaveFiveHealthUser(); return NextResponse.json(await recommendationsRequest(request)); }
