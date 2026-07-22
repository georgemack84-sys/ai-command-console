import { NextResponse } from "next/server";
import { contractsRequest, requireTrustFoundationStageOneUser } from "../core";

export async function GET() { await requireTrustFoundationStageOneUser(); return NextResponse.json(await contractsRequest()); }
export async function POST(request: Request) { await requireTrustFoundationStageOneUser(); return NextResponse.json(await contractsRequest(request)); }
