import { NextResponse } from "next/server";
import { qualificationRequest, requireCapabilityRegistryUser } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await qualificationRequest(request)); }
