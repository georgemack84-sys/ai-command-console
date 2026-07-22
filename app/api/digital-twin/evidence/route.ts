import { NextResponse } from "next/server";
import { evidenceRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await evidenceRequest(request)); }
