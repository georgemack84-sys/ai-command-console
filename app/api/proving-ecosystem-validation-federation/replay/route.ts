import { NextResponse } from "next/server";
import { replayRequest, requireFederationUser } from "../core";
export async function GET() { await requireFederationUser(); return NextResponse.json(await replayRequest()); }
export async function POST(request: Request) { await requireFederationUser(); return NextResponse.json(await replayRequest(request)); }
