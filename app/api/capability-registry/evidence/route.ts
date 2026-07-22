import { NextResponse } from "next/server";
import { evidenceRequest, requireCapabilityRegistryUser } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await evidenceRequest(request)); }
