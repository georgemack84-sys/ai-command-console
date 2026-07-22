import { NextResponse } from "next/server";
import { impactRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await impactRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await impactRequest(request)); }
