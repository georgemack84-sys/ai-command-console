import { NextResponse } from "next/server";
import { actionRoutingRequest, requireWaveFiveAuroraUser } from "../core";

export async function GET() { await requireWaveFiveAuroraUser(); return NextResponse.json(await actionRoutingRequest()); }
export async function POST(request: Request) { await requireWaveFiveAuroraUser(); return NextResponse.json(await actionRoutingRequest(request)); }
