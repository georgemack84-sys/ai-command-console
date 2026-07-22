import { NextResponse } from "next/server";
import { requireDigitalTwinUser, visualizationRequest } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await visualizationRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await visualizationRequest(request)); }
