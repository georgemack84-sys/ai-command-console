import { NextResponse } from "next/server";
import { contractResponse, requireWaveFivePlatformBridgeGatewayUser } from "../core";

export async function GET() { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(contractResponse()); }
