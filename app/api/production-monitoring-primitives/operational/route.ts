import { NextResponse } from "next/server";
import { operationalRequest, requireProductionMonitoringPrimitivesUser } from "../core";

export async function GET() { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await operationalRequest()); }
export async function POST(request: Request) { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await operationalRequest(request)); }
