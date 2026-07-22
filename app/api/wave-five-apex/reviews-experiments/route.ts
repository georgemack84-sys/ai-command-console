import { NextResponse } from "next/server";
import { requireWaveFiveApexUser, reviewsExperimentsRequest } from "../core";

export async function GET() { await requireWaveFiveApexUser(); return NextResponse.json(await reviewsExperimentsRequest()); }
export async function POST(request: Request) { await requireWaveFiveApexUser(); return NextResponse.json(await reviewsExperimentsRequest(request)); }
