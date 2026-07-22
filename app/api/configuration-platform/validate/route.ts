import { NextResponse } from "next/server";
import { requireConfigurationPlatformUser, validateRequest } from "../core";
export async function POST(request: Request) { await requireConfigurationPlatformUser(); return NextResponse.json(await validateRequest(request)); }
