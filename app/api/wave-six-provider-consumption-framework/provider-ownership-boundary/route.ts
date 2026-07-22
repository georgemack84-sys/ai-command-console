import { NextResponse } from "next/server";
import { providerOwnershipBoundaryRequest, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await providerOwnershipBoundaryRequest()); }
export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await providerOwnershipBoundaryRequest(request)); }
