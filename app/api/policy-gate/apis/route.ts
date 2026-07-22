import { NextResponse } from "next/server";
import { apisRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await apisRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await apisRequest(request)); }
