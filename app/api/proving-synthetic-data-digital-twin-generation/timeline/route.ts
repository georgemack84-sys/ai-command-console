import { NextResponse } from "next/server";
import { requireSyntheticGenerationUser, timelineRequest } from "../core";

export async function GET() { await requireSyntheticGenerationUser(); return NextResponse.json(await timelineRequest()); }
export async function POST(request: Request) { await requireSyntheticGenerationUser(); return NextResponse.json(await timelineRequest(request)); }
