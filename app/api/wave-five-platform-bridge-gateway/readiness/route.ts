import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFivePlatformBridgeGatewayUser } from "../core";

export async function GET() { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await readinessRequest(request)); }
