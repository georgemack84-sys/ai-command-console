import { NextResponse } from "next/server";
import { eventsRequest, requireTrustFoundationStageOneUser } from "../core";

export async function GET() { await requireTrustFoundationStageOneUser(); return NextResponse.json(await eventsRequest()); }
export async function POST(request: Request) { await requireTrustFoundationStageOneUser(); return NextResponse.json(await eventsRequest(request)); }
