import { NextResponse } from "next/server";
import { goalsProjectsRequest, requireWaveSixPersonalOperationalContextUser } from "../core";

export async function GET() { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await goalsProjectsRequest()); }
export async function POST(request: Request) { await requireWaveSixPersonalOperationalContextUser(); return NextResponse.json(await goalsProjectsRequest(request)); }
