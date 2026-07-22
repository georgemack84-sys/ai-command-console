import { NextResponse } from "next/server";
import { requireProductionMonitoringPrimitivesUser, sourcesRequest } from "../core";

export async function GET() { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await sourcesRequest()); }
export async function POST(request: Request) { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await sourcesRequest(request)); }
