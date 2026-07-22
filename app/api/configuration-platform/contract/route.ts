import { NextResponse } from "next/server";
import { contractResponse, requireConfigurationPlatformUser } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(contractResponse()); }
