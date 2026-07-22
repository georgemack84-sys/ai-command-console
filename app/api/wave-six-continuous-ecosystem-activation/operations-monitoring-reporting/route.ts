import { NextResponse } from "next/server";
import { operationsMonitoringReportingRequest, requireWaveSixContinuousEcosystemActivationUser } from "../core";

export async function GET() { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await operationsMonitoringReportingRequest()); }
export async function POST(request: Request) { await requireWaveSixContinuousEcosystemActivationUser(); return NextResponse.json(await operationsMonitoringReportingRequest(request)); }
