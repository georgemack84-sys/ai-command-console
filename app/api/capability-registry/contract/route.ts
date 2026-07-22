import { NextResponse } from "next/server";
import { contractResponse, requireCapabilityRegistryUser } from "../core";
export async function GET() { await requireCapabilityRegistryUser(); return NextResponse.json(contractResponse()); }
