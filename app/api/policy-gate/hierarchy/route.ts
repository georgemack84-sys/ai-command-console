import { NextResponse } from "next/server";
import { hierarchyRequest, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(await hierarchyRequest()); }
export async function POST(request: Request) { await requirePolicyGateUser(); return NextResponse.json(await hierarchyRequest(request)); }
