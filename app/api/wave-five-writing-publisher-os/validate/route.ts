import { NextResponse } from "next/server";
import { requireWaveFiveWritingPublisherUser, validateRequest } from "../core";

export async function POST(request: Request) { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(await validateRequest(request)); }
