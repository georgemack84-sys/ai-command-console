import { NextResponse } from "next/server";
import { publisherOsRequest, requireWaveFiveWritingPublisherUser } from "../core";

export async function GET() { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await publisherOsRequest()); }
export async function POST(request: Request) { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await publisherOsRequest(request)); }
