import { NextResponse } from "next/server";
import { environmentsRequest, requireConfigurationPlatformUser } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(await environmentsRequest()); }
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await environmentsRequest(request)); }
