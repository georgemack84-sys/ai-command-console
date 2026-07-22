import { NextResponse } from "next/server";
import { requirePolicyGateUser, resolutionRequest } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await resolutionRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await resolutionRequest(request)); }
