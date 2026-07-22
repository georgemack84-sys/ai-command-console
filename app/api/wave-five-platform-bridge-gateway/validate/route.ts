import { NextResponse } from "next/server";
import { requireWaveFivePlatformBridgeGatewayUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFivePlatformBridgeGatewayUser(); return NextResponse.json(await validateRequest(request)); }
