import { NextResponse } from "next/server";
import { graphRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await graphRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await graphRequest(request)); }
