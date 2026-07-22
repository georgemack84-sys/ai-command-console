import { NextResponse } from "next/server";
import { externalConnectionsRequest, requireWaveFivePlatformBridgeGatewayUser } from "../core";

export async function GET() { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await externalConnectionsRequest()); }
export async function POST(request: Request) { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await externalConnectionsRequest(request)); }
