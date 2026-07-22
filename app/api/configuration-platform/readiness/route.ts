import { NextResponse } from "next/server";
import { readinessRequest, requireConfigurationPlatformUser } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await readinessRequest(request)); }
