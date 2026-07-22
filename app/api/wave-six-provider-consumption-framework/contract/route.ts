import { NextResponse } from "next/server";
import { contractResponse, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(contractResponse()); }
