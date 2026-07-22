import { NextResponse } from "next/server";
import { evidenceRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await evidenceRequest(request)); }
