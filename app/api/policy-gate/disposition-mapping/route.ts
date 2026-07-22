import { NextResponse } from "next/server";
import { dispositionMappingRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await dispositionMappingRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await dispositionMappingRequest(request)); }
