import { NextResponse } from "next/server";
import { apisRequest, requireDigitalTwinUser } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await apisRequest(request)); }
