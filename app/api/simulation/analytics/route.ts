import { NextResponse } from "next/server";
import { analyticsRequest, requireSimulationUser } from "../core";

export async function GET() { await requireSimulationUser(); return NextResponse.json(await analyticsRequest()); }
export async function POST(request: Request) { await requireSimulationUser(); return NextResponse.json(await analyticsRequest(request)); }
