import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveCalendarTimeUser } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(contractResponse()); }
