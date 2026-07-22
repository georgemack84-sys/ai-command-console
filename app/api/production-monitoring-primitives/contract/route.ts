import { NextResponse } from "next/server";
import { contractResponse, requireProductionMonitoringPrimitivesUser } from "../core";

export async function GET() { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(contractResponse()); }
