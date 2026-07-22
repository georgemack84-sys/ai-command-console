import { NextResponse } from "next/server";
import { divergenceRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await divergenceRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await divergenceRequest(request)); }
