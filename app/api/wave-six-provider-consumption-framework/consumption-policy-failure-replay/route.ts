import { NextResponse } from "next/server";
import { consumptionPolicyFailureReplayRequest, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await consumptionPolicyFailureReplayRequest()); }
export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await consumptionPolicyFailureReplayRequest(request)); }
