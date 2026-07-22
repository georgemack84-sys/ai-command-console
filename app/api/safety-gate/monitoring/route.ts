import { NextResponse } from "next/server";
import { monitoringRequest, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await monitoringRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await monitoringRequest(request)); }
