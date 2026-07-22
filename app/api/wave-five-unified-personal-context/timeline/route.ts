import { NextResponse } from "next/server";
import { requireWaveFiveUnifiedPersonalContextUser, timelineRequest } from "../core";

export async function GET() { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await timelineRequest()); }
export async function POST(request: Request) { await requireWaveFiveUnifiedPersonalContextUser(); return NextResponse.json(await timelineRequest(request)); }
