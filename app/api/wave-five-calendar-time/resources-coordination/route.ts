import { NextResponse } from "next/server";
import { requireWaveFiveCalendarTimeUser, resourcesCoordinationRequest } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await resourcesCoordinationRequest()); }
export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await resourcesCoordinationRequest(request)); }
