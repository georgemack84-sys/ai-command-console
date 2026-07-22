import { NextResponse } from "next/server";
import { requireObservabilityPlatformUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireObservabilityPlatformUser(); return NextResponse.json(await validateRequest(request)); }
