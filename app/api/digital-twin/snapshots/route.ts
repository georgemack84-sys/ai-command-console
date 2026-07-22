import { NextResponse } from "next/server";
import { requireDigitalTwinUser, snapshotsRequest } from "../core";

export async function GET() { await requireDigitalTwinUser(); return NextResponse.json(await snapshotsRequest()); }
export async function POST(request: Request) { await requireDigitalTwinUser(); return NextResponse.json(await snapshotsRequest(request)); }
