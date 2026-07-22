import { NextResponse } from "next/server";
import { requireWaveFiveCalendarTimeUser, schedulingRequest } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await schedulingRequest()); }
export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await schedulingRequest(request)); }
