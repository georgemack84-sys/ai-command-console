import { NextResponse } from "next/server";
import { requireConfigurationPlatformUser, runtimeRequest } from "../core";
export async function GET() { await requireConfigurationPlatformUser(); return NextResponse.json(await runtimeRequest()); }
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await runtimeRequest(request)); }
