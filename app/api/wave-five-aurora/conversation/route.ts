import { NextResponse } from "next/server";
import { conversationRequest, requireWaveFiveAuroraUser } from "../core";

export async function GET() { await requireWaveFiveAuroraUser(); return NextResponse.json(await conversationRequest()); }
export async function POST(request: Request) { await requireWaveFiveAuroraUser(); return NextResponse.json(await conversationRequest(request)); }
