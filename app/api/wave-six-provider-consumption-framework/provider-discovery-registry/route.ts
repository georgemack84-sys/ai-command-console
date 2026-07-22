import { NextResponse } from "next/server";
import { providerDiscoveryRegistryRequest, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await providerDiscoveryRegistryRequest()); }
export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await providerDiscoveryRegistryRequest(request)); }
