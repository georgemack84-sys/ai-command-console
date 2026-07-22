import { NextResponse } from "next/server";
import { healthRequest, requireProductionMonitoringPrimitivesUser } from "../core";

export async function GET() { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await healthRequest()); }
export async function POST(request: Request) { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await healthRequest(request)); }
