import { NextResponse } from "next/server";
import { requireDigitalTwinUser, synchronizationRequest } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await synchronizationRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await synchronizationRequest(request)); }
