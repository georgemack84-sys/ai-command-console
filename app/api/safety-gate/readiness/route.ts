import { NextResponse } from "next/server";
import { readinessRequest, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await readinessRequest(request)); }
