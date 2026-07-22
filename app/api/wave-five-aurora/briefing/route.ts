import { NextResponse } from "next/server";
import { briefingRequest, requireWaveFiveAuroraUser } from "../core";

export async function GET() { await requireWaveFiveAuroraUser(); return NextResponse.json(await briefingRequest()); }
export async function POST(request: Request) { await requireWaveFiveAuroraUser(); return NextResponse.json(await briefingRequest(request)); }
