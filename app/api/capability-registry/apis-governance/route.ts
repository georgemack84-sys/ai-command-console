import { NextResponse } from "next/server";
import { apisGovernanceRequest, requireCapabilityRegistryUser } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await apisGovernanceRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await apisGovernanceRequest(request)); }
