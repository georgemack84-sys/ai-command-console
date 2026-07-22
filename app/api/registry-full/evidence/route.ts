import { NextResponse } from "next/server";
import { evidenceRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await evidenceRequest(request)); }
