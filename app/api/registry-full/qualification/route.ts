import { NextResponse } from "next/server";
import { qualificationRequest, requireRegistryFullUser } from "../core";
export async function GET() { await requireRegistryFullUser(); return NextResponse.json(await qualificationRequest()); }
export async function POST(request: Request) { await requireRegistryFullUser(); return NextResponse.json(await qualificationRequest(request)); }
