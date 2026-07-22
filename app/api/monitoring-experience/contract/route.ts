import { NextResponse } from "next/server";
import { contractResponse, requireMonitoringExperienceUser } from "../core";

export async function GET() { await requireMonitoringExperienceUser(); return NextResponse.json(contractResponse()); }
