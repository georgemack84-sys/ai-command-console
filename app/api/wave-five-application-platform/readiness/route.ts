import { NextResponse } from "next/server";
import { readinessRequest, requireWaveFiveApplicationPlatformUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await readinessRequest(request)); }
