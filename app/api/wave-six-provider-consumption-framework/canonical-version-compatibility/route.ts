import { NextResponse } from "next/server";
import { canonicalVersionCompatibilityRequest, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await canonicalVersionCompatibilityRequest()); }
export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await canonicalVersionCompatibilityRequest(request)); }
