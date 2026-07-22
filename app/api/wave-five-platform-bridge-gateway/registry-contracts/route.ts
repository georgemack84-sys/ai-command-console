import { NextResponse } from "next/server";
import { registryContractsRequest, requireWaveFivePlatformBridgeGatewayUser } from "../core";

export async function GET() { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await registryContractsRequest()); }
export async function POST(request: Request) { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await registryContractsRequest(request)); }
