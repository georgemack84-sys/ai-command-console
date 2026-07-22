import { NextResponse } from "next/server";
import { readinessRequest, requireCapabilityRegistryUser } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await readinessRequest(request)); }
