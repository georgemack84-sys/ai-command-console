import { NextResponse } from "next/server";
import { readinessRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await readinessRequest(request)); }
