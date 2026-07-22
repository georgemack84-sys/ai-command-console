import { NextResponse } from "next/server";
import { compatibilityRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await compatibilityRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await compatibilityRequest(request)); }
