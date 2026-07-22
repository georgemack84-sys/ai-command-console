import { NextResponse } from "next/server";
import { contractResponse, requirePolicyGateUser } from "../core";

export async function GET() { await requirePolicyGateUser(); return NextResponse.json(contractResponse()); }
