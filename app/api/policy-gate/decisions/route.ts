import { NextResponse } from "next/server";
import { decisionsRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await decisionsRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await decisionsRequest(request)); }
