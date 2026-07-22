import { NextResponse } from "next/server";
import { requireCapabilityRegistryUser, riskRequest } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await riskRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await riskRequest(request)); }
