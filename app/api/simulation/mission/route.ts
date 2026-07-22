import { NextResponse } from "next/server";
import { missionRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await missionRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await missionRequest(request)); }
