import { NextResponse } from "next/server";
import { commandsRequest, requireWaveFiveApplicationPlatformUser } from "../core";

export async function GET() { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await commandsRequest()); }
export async function POST(request: Request) { await requireWaveFiveApplicationPlatformUser(); return NextResponse.json(await commandsRequest(request)); }
