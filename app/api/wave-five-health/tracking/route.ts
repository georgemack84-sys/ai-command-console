import { NextResponse } from "next/server";
import { requireWaveFiveHealthUser, trackingRequest } from "../core";

export async function GET() { await requireWaveFiveHealthUser(); return NextResponse.json(await trackingRequest()); }
export async function POST(request: Request) { await requireWaveFiveHealthUser(); return NextResponse.json(await trackingRequest(request)); }
