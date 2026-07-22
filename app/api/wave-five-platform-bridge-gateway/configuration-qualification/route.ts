import { NextResponse } from "next/server";
import { configurationQualificationRequest, requireWaveFivePlatformBridgeGatewayUser } from "../core";

export async function GET() { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await configurationQualificationRequest()); }
export async function POST(request: Request) { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await configurationQualificationRequest(request)); }
