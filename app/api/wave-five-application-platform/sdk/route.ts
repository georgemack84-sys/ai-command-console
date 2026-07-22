import { NextResponse } from "next/server";
import { requireWaveFiveApplicationPlatformUser, sdkRequest } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await sdkRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await sdkRequest(request)); }
