import { NextResponse } from "next/server";
import { requireCapabilityRegistryUser, validationEngineRequest } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(await validationEngineRequest()); }
export async function POST(request: Request) { await requireCapabilityRegistryUser(); return NextResponse.json(await validationEngineRequest(request)); }
