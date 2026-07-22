import { NextResponse } from "next/server";
import { evidenceRequest, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await evidenceRequest(request)); }
