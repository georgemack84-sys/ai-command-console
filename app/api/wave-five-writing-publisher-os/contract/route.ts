import { NextResponse } from "next/server";
import { contractResponse, requireWaveFiveWritingPublisherUser } from "../core";

export async function GET() { await requireWaveFiveWritingPublisherUser(); return NextResponse.json(contractResponse()); }
