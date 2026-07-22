import { NextResponse } from "next/server";
import { gatewayRequest, requireWaveFiveApplicationPlatformUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await gatewayRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await gatewayRequest(request)); }
