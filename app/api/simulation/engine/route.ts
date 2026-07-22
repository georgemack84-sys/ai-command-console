import { NextResponse } from "next/server";
import { engineRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await engineRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await engineRequest(request)); }
