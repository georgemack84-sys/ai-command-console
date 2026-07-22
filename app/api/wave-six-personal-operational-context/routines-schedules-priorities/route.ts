import { NextResponse } from "next/server";
import { requireWaveSixPersonalOperationalContextUser, routinesSchedulesPrioritiesRequest } from "../core";

export async function GET() { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await routinesSchedulesPrioritiesRequest()); }
export async function POST(request: Request) { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await routinesSchedulesPrioritiesRequest(request)); }
