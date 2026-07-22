import { NextResponse } from "next/server";
import { emergencyStopRequest, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await emergencyStopRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await emergencyStopRequest(request)); }
