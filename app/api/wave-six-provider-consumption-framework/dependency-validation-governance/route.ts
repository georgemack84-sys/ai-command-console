import { NextResponse } from "next/server";
import { dependencyValidationGovernanceRequest, requireWaveSixProviderConsumptionFrameworkUser } from "../core";

export async function GET() { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await dependencyValidationGovernanceRequest()); }
export async function POST(request: Request) { await requireWaveSixProviderConsumptionFrameworkUser(); return NextResponse.json(await dependencyValidationGovernanceRequest(request)); }
