import { NextResponse } from "next/server";
import { registryRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await registryRequest(request)); }
