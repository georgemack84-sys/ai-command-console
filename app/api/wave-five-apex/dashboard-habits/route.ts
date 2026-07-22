import { NextResponse } from "next/server";
import { dashboardHabitsRequest, requireWaveFiveApexUser } from "../core";

export async function GET() { await requireWaveFiveApexUser(); return NextResponse.json(await dashboardHabitsRequest()); }
export async function POST(request: Request) { await requireWaveFiveApexUser(); return NextResponse.json(await dashboardHabitsRequest(request)); }
