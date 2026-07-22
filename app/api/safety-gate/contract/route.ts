import { NextResponse } from "next/server";
import { contractResponse, requireSafetyGateUser } from "../core";

export async function GET() { await requireSafetyGateUser(); return NextResponse.json(contractResponse()); }
