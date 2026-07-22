import { NextResponse } from "next/server";
import { compositionRequest, requireCapabilityRegistryUser } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await compositionRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await compositionRequest(request)); }
