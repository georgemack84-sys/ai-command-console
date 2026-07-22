import { NextResponse } from "next/server";
import { exceptionsRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await exceptionsRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await exceptionsRequest(request)); }
