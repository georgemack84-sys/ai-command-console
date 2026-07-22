import { NextResponse } from "next/server";
import { readinessRequest, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await readinessRequest(request)); }
