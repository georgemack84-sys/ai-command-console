import { NextResponse } from "next/server";
import { readinessRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await readinessRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await readinessRequest(request)); }
