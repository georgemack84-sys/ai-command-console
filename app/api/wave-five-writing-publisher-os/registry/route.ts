import { NextResponse } from "next/server";
import { registryRequest, requireWaveFiveWritingPublisherUser } from "../core";

export async function GET() { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await registryRequest()); }
export async function POST(request: Request) { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await registryRequest(request)); }
