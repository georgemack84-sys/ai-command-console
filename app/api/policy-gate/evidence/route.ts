import { NextResponse } from "next/server";
import { evidenceRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await evidenceRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await evidenceRequest(request)); }
