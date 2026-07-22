import { NextResponse } from "next/server";
import { contractResponse, requireTrustFoundationStageOneUser } from "../core";

export async function GET() { await requireTrustFoundationStageOneUser(); return NextResponse.json(contractResponse()); }
