import { NextResponse } from "next/server";
import { reportsRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await reportsRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await reportsRequest(request)); }
