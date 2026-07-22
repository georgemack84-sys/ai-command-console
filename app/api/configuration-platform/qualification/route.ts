import { NextResponse } from "next/server";
import { qualificationRequest, requireConfigurationPlatformUser } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await qualificationRequest(request)); }
