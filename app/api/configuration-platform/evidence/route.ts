import { NextResponse } from "next/server";
import { evidenceRequest, requireConfigurationPlatformUser } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await evidenceRequest(request)); }
