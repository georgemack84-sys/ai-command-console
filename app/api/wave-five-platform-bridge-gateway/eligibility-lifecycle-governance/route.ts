import { NextResponse } from "next/server";
import { eligibilityLifecycleGovernanceRequest, requireWaveFivePlatformBridgeGatewayUser } from "../core";

export async function GET() { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await eligibilityLifecycleGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await eligibilityLifecycleGovernanceRequest(request)); }
