import { NextResponse } from "next/server";
import { requireWaveFiveCalendarTimeUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveCalendarTimeUser(); return NextResponse.json(await validateRequest(request)); }
