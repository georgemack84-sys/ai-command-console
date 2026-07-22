import { NextResponse } from "next/server";
import { configurationValidationRequest, requireConfigurationPlatformUser } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(await configurationValidationRequest()); }
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await configurationValidationRequest(request)); }
