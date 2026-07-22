import { NextResponse } from "next/server";
import { readinessRequest, requireProductionMonitoringPrimitivesUser } from "../core";

export async function GET() { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await readinessRequest(request)); }
