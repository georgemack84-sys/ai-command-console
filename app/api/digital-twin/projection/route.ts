import { NextResponse } from "next/server";
import { projectionRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await projectionRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await projectionRequest(request)); }
