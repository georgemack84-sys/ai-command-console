import { NextResponse } from "next/server";
import { contractsRequest, requireProductionMonitoringPrimitivesUser } from "../core";

export async function GET() { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await contractsRequest()); }
export async function POST(request: Request) { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await contractsRequest(request)); }
