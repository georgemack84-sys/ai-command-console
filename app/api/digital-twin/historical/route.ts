import { NextResponse } from "next/server";
import { historicalRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await historicalRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await historicalRequest(request)); }
