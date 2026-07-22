import { NextResponse } from "next/server";
import { requireProductionMonitoringPrimitivesUser, resourcesRequest } from "../core";

export async function GET() { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await resourcesRequest()); }
export async function POST(request: Request) { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await resourcesRequest(request)); }
