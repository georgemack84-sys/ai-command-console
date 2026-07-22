import { NextResponse } from "next/server";
import { requireWaveFiveApplicationPlatformUser, searchRequest } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await searchRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await searchRequest(request)); }
