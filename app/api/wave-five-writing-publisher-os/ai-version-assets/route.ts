import { NextResponse } from "next/server";
import { aiVersionAssetsRequest, requireWaveFiveWritingPublisherUser } from "../core";

export async function GET() { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await aiVersionAssetsRequest()); }
export async function POST(request: Request) { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await aiVersionAssetsRequest(request)); }
