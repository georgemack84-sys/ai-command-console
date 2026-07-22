import { NextResponse } from "next/server";
import { conflictsRequest, requireWaveFiveCalendarTimeUser } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await conflictsRequest()); }
export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await conflictsRequest(request)); }
