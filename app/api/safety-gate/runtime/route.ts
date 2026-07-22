import { NextResponse } from "next/server";
import { requireSafetyGateUser, runtimeRequest } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(await runtimeRequest()); }
export async function POST(request: Request) { await requireSafetyGateUser(); return NextResponse.json(await runtimeRequest(request)); }
