import { NextResponse } from "next/server";
import { navigationRequest, requireWaveFiveApplicationPlatformUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await navigationRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await navigationRequest(request)); }
