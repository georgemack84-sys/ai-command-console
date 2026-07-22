import { NextResponse } from "next/server";
import { readinessRequest, requireWaveSixPersonalOperationalContextUser } from "../core";

export async function GET() { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await readinessRequest(request)); }
