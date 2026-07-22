import { NextResponse } from "next/server";
import { registryRequest, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await registryRequest(request)); }
