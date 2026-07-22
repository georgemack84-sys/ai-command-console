import { NextResponse } from "next/server";
import { contractResponse, requireObservabilityPlatformUser } from "../core";
export async function GET() { await requireObservabilityPlatformUser(); return NextResponse.json(contractResponse()); }
