import { NextResponse } from "next/server";
import { readinessRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await readinessRequest(request)); }
