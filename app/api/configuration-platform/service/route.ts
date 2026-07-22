import { NextResponse } from "next/server";
import { requireConfigurationPlatformUser, serviceRequest } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(await serviceRequest()); }
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await serviceRequest(request)); }
