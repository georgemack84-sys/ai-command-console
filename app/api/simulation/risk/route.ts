import { NextResponse } from "next/server";
import { requireSimulationUser, riskRequest } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await riskRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await riskRequest(request)); }
