import { NextResponse } from "next/server";
import { consumerContractRegistryRequest, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await consumerContractRegistryRequest()); }
export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await consumerContractRegistryRequest(request)); }
