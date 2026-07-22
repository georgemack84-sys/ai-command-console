import { NextResponse } from "next/server";
import { availabilityRequest, requireWaveFiveCalendarTimeUser } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await availabilityRequest()); }
export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await availabilityRequest(request)); }
