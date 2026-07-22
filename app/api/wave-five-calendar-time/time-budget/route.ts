import { NextResponse } from "next/server";
import { requireWaveFiveCalendarTimeUser, timeBudgetRequest } from "../core";

export async function GET() { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await timeBudgetRequest()); }
export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await timeBudgetRequest(request)); }
