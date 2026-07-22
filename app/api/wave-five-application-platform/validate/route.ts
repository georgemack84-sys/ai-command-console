import { NextResponse } from "next/server";
import { requireWaveFiveApplicationPlatformUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await validateRequest(request)); }
