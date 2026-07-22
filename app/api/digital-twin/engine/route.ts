import { NextResponse } from "next/server";
import { engineRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await engineRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await engineRequest(request)); }
