import { NextResponse } from "next/server";
import { editorialRequest, requireWaveFiveWritingPublisherUser } from "../core";

export async function GET() { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await editorialRequest()); }
export async function POST(request: Request) { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await editorialRequest(request)); }
