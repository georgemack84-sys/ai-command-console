import { NextResponse } from "next/server";
import { readinessRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await readinessRequest(request)); }
