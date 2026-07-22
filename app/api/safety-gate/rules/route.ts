import { NextResponse } from "next/server";
import { requireSafetyGateUser, rulesRequest } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await rulesRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await rulesRequest(request)); }
