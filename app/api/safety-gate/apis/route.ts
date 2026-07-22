import { NextResponse } from "next/server";
import { apisRequest, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await apisRequest(request)); }
