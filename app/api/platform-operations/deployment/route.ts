import { NextResponse } from "next/server";
import { deploymentRequest, requirePlatformOperationsUser } from "../core";
export async function GET() { await requirePlatformOperationsUser(); return NextResponse.json(await deploymentRequest()); }
export async function POST(request: Request) { await requirePlatformOperationsUser(); return NextResponse.json(await deploymentRequest(request)); }
