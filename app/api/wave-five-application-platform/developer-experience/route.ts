import { NextResponse } from "next/server";
import { developerExperienceRequest, requireWaveFiveApplicationPlatformUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await developerExperienceRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await developerExperienceRequest(request)); }
