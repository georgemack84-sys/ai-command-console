import { NextResponse } from "next/server";
import { escalationRequest, requireWaveFiveHealthUser } from "../core";

export async function GET() { await requireWaveFiveHealthUser(); return NextResponse.json(await escalationRequest()); }
export async function POST(request: Request) { await requireWaveFiveHealthUser(); return NextResponse.json(await escalationRequest(request)); }
