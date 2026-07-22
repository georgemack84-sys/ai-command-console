import { NextResponse } from "next/server";
import { contractResponse, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(contractResponse()); }
