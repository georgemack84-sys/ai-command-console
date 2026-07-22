import { NextResponse } from "next/server";
import { requireWaveFiveApplicationPlatformUser, shellRequest } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await shellRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await shellRequest(request)); }
