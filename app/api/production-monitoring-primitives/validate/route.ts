import { NextResponse } from "next/server";
import { requireProductionMonitoringPrimitivesUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireProductionMonitoringPrimitivesUser(); return NextResponse.json(await validateRequest(request)); }
