import { NextResponse } from "next/server";
import { conflictsRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await conflictsRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await conflictsRequest(request)); }
