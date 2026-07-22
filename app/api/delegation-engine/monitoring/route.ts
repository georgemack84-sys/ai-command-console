import { NextResponse } from "next/server";
import { monitoringRequest, requireDelegationEngineUser } from "../core";

export async function GET() { await requireDelegationEngineUser(); return NextResponse.json(await monitoringRequest()); }
export async function POST(request: Request) { await requireDelegationEngineUser(); return NextResponse.json(await monitoringRequest(request)); }
