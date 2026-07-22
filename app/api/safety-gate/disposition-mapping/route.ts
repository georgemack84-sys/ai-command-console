import { NextResponse } from "next/server";
import { dispositionMappingRequest, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await dispositionMappingRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await dispositionMappingRequest(request)); }
